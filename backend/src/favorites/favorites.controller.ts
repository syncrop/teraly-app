import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('me/favorites')
@UseGuards(FirebaseAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.favorites.listMyFavorites(user.uid);
  }

  @Get(':doctorId')
  async isFavorite(@CurrentUser() user: any, @Param('doctorId') doctorId: string) {
    return this.favorites.isFavorite(user.uid, doctorId);
  }

  @Post(':doctorId')
  async add(@CurrentUser() user: any, @Param('doctorId') doctorId: string) {
    return this.favorites.addFavorite(user.uid, doctorId);
  }

  @Delete(':doctorId')
  async remove(@CurrentUser() user: any, @Param('doctorId') doctorId: string) {
    return this.favorites.removeFavorite(user.uid, doctorId);
  }
}
