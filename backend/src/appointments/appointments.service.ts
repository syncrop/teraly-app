import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../db/mongo.service';
import { UsersService } from '../users/users.service';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from './appointments.types';

type AppointmentDoc = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> & {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new NotFoundException('Invalid id');
  }
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly users: UsersService
  ) {}

  async list(params: {
    requesterUid: string;
    doctorId?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    const requester = await this.users.getByUid(params.requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    if (params.doctorId) {
      if (requester.role !== 'doctor' || requester.uid !== params.doctorId) {
        throw new ForbiddenException('Not allowed');
      }
    }

    if (params.clientId) {
      if (requester.uid !== params.clientId) {
        // doctors may query by clientId only when scoped by doctorId (their own)
        if (!(requester.role === 'doctor' && params.doctorId === requester.uid)) {
          throw new ForbiddenException('Not allowed');
        }
      }
    }

    const filter: Record<string, unknown> = {};
    if (params.doctorId) filter.doctorId = params.doctorId;
    if (params.clientId) filter.clientId = params.clientId;

    if (params.startDate || params.endDate) {
      filter.date = {};
      if (params.startDate) (filter.date as any).$gte = params.startDate;
      if (params.endDate) (filter.date as any).$lte = params.endDate;
    }

    const docs = (await this.mongo
      .appointments()
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .toArray()) as AppointmentDoc[];

    return docs.map((d) => this.toAppointment(d));
  }

  async getById(requesterUid: string, appointmentId: string): Promise<Appointment | null> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const doc = (await this.mongo.appointments().findOne({ _id: toObjectId(appointmentId) })) as AppointmentDoc | null;
    if (!doc) return null;

    if (requester.role === 'client' && doc.clientId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }
    if (requester.role === 'doctor' && doc.doctorId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }

    return this.toAppointment(doc);
  }

  async create(requesterUid: string, payload: CreateAppointmentInput): Promise<{ id: string }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    // Doctors can create appointments for their clients; clients can only create their own.
    if (requester.role === 'client' && payload.clientId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }

    if (requester.role === 'doctor' && payload.doctorId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }

    const now = new Date();
    const insert = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.mongo.appointments().insertOne(insert);
    return { id: String(result.insertedId) };
  }

  async update(requesterUid: string, appointmentId: string, updates: UpdateAppointmentInput): Promise<{ success: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const existing = (await this.mongo.appointments().findOne({ _id: toObjectId(appointmentId) })) as AppointmentDoc | null;
    if (!existing) return { success: false };

    if (requester.role === 'client' && existing.clientId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }
    if (requester.role === 'doctor' && existing.doctorId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }

    await this.mongo.appointments().updateOne(
      { _id: existing._id },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return { success: true };
  }

  async delete(requesterUid: string, appointmentId: string): Promise<{ success: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const existing = (await this.mongo.appointments().findOne({ _id: toObjectId(appointmentId) })) as AppointmentDoc | null;
    if (!existing) return { success: false };

    if (requester.role === 'client' && existing.clientId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }
    if (requester.role === 'doctor' && existing.doctorId !== requester.uid) {
      throw new ForbiddenException('Not allowed');
    }

    const res = await this.mongo.appointments().deleteOne({ _id: existing._id });
    return { success: res.deletedCount === 1 };
  }

  async isTimeSlotAvailable(params: {
    requesterUid: string;
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }): Promise<{ available: boolean }> {
    const requester = await this.users.getByUid(params.requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    // Only the doctor can check their own availability (matches current UI usage).
    if (requester.role !== 'doctor' || requester.uid !== params.doctorId) {
      throw new ForbiddenException('Not allowed');
    }

    const filter: Record<string, unknown> = {
      doctorId: params.doctorId,
      date: params.date,
    };

    if (params.excludeAppointmentId) {
      filter._id = { $ne: toObjectId(params.excludeAppointmentId) };
    }

    // Overlap condition: start < existing.end && end > existing.start
    filter.$expr = {
      $and: [
        { $lt: [params.startTime, '$endTime'] },
        { $gt: [params.endTime, '$startTime'] },
      ],
    };

    const conflict = await this.mongo.appointments().findOne(filter);
    return { available: !conflict };
  }

  private toAppointment(doc: AppointmentDoc): Appointment {
    return {
      id: String(doc._id),
      doctorId: doc.doctorId,
      doctorName: doc.doctorName,
      doctorPhotoUrl: doc.doctorPhotoUrl,
      clientId: doc.clientId,
      clientName: doc.clientName,
      clientPhoto: doc.clientPhoto,
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      duration: doc.duration,
      status: doc.status,
      type: doc.type,
      reason: doc.reason,
      notes: doc.notes,
      price: doc.price,
      currency: doc.currency,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
    };
  }
}
