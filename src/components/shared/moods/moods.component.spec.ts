import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodsComponent } from './moods.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('MoodsComponent', () => {
  let component: MoodsComponent;
  let fixture: ComponentFixture<MoodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoodsComponent, CommonModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default mood "bien"', () => {
    expect(component.selectedMood()).toBe('bien');
  });

  it('should initialize showQuestions as false', () => {
    expect(component.showQuestions()).toBe(false);
  });

  it('should initialize moods array with 4 moods', () => {
    expect(component.moods.length).toBe(4);
    expect(component.moods[0].id).toBe('mal');
    expect(component.moods[1].id).toBe('regular');
    expect(component.moods[2].id).toBe('bien');
    expect(component.moods[3].id).toBe('genial');
  });

  it('should have mood emojis', () => {
    expect(component.moods[0].emoji).toBe('😔');
    expect(component.moods[1].emoji).toBe('😐');
    expect(component.moods[2].emoji).toBe('🙂');
    expect(component.moods[3].emoji).toBe('😄');
  });

  it('should initialize moodQuestions array with 5 questions', () => {
    expect(component.moodQuestions.length).toBe(5);
  });

  describe('onMoodSelect', () => {
    it('should update selectedMood when a mood is selected', () => {
      component.onMoodSelect('genial');
      expect(component.selectedMood()).toBe('genial');
    });

    it('should set showQuestions to true when a mood is selected', () => {
      component.onMoodSelect('mal');
      expect(component.showQuestions()).toBe(true);
    });

    it('should handle edge case: selecting same mood multiple times', () => {
      component.onMoodSelect('bien');
      component.onMoodSelect('bien');
      expect(component.selectedMood()).toBe('bien');
      expect(component.showQuestions()).toBe(true);
    });
  });

  describe('updateResponse', () => {
    it('should update mood responses for a question', () => {
      component.updateResponse('sleep', 8);
      expect(component.moodResponses()['sleep']).toBe(8);
    });

    it('should handle string responses', () => {
      component.updateResponse('notes', 'Feeling great today');
      expect(component.moodResponses()['notes']).toBe('Feeling great today');
    });

    it('should update multiple responses', () => {
      component.updateResponse('sleep', 7);
      component.updateResponse('energy', 9);
      component.updateResponse('stress', 3);
      
      const responses = component.moodResponses();
      expect(responses['sleep']).toBe(7);
      expect(responses['energy']).toBe(9);
      expect(responses['stress']).toBe(3);
    });

    it('should overwrite existing response for same question', () => {
      component.updateResponse('anxiety', 5);
      component.updateResponse('anxiety', 8);
      expect(component.moodResponses()['anxiety']).toBe(8);
    });
  });

  describe('getResponse', () => {
    it('should return empty string for unanswered question', () => {
      expect(component.getResponse('sleep')).toBe('');
    });

    it('should return the response value when answered', () => {
      component.updateResponse('energy', 10);
      expect(component.getResponse('energy')).toBe(10);
    });

    it('should handle edge case: response with value 0', () => {
      component.updateResponse('stress', 0);
      expect(component.getResponse('stress')).toBe(0);
    });
  });

  describe('getCurrentMood', () => {
    it('should return the current mood object', () => {
      component.onMoodSelect('genial');
      const currentMood = component.getCurrentMood();
      expect(currentMood).toBeDefined();
      expect(currentMood?.id).toBe('genial');
      expect(currentMood?.emoji).toBe('😄');
    });

    it('should return undefined for invalid mood', () => {
      component.selectedMood.set('invalid' as any);
      const currentMood = component.getCurrentMood();
      expect(currentMood).toBeUndefined();
    });
  });

  describe('saveMoodEntry', () => {
    beforeEach(() => {
      spyOn(console, 'log');
    });

    it('should create mood entry with current mood and responses', () => {
      component.onMoodSelect('bien');
      component.updateResponse('sleep', 8);
      component.updateResponse('notes', 'Test note');
      
      component.saveMoodEntry();
      
      expect(console.log).toHaveBeenCalled();
      const loggedEntry = (console.log as jasmine.Spy).calls.mostRecent().args[1];
      expect(loggedEntry.mood).toBe('bien');
      expect(loggedEntry.responses['sleep']).toBe(8);
      expect(loggedEntry.responses['notes']).toBe('Test note');
      expect(loggedEntry.timestamp).toBeDefined();
    });

    it('should close questions after saving', () => {
      component.showQuestions.set(true);
      component.saveMoodEntry();
      expect(component.showQuestions()).toBe(false);
    });

    it('should reset moodResponses after saving', () => {
      component.updateResponse('sleep', 7);
      component.saveMoodEntry();
      expect(Object.keys(component.moodResponses()).length).toBe(0);
    });
  });

  describe('closeQuestions', () => {
    it('should set showQuestions to false', () => {
      component.showQuestions.set(true);
      component.closeQuestions();
      expect(component.showQuestions()).toBe(false);
    });

    it('should reset moodResponses', () => {
      component.updateResponse('sleep', 5);
      component.updateResponse('energy', 6);
      component.closeQuestions();
      expect(Object.keys(component.moodResponses()).length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty mood selection', () => {
      component.onMoodSelect('');
      expect(component.selectedMood()).toBe('');
    });

    it('should handle questions with boundary values', () => {
      const sleepQuestion = component.moodQuestions.find(q => q.id === 'sleep');
      expect(sleepQuestion?.min).toBe(1);
      expect(sleepQuestion?.max).toBe(10);
      
      component.updateResponse('sleep', sleepQuestion?.min);
      expect(component.getResponse('sleep')).toBe(1);
      
      component.updateResponse('sleep', sleepQuestion?.max);
      expect(component.getResponse('sleep')).toBe(10);
    });

    it('should handle very long text notes', () => {
      const longText = 'a'.repeat(1000);
      component.updateResponse('notes', longText);
      expect(component.getResponse('notes')).toBe(longText);
    });
  });
});
