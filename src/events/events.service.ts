import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateEventDto, UpdateEventDto } from './events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createEvent(createEvent: CreateEventDto) {
    try {
        const {
            userId,
            eventName,
            description,
            organizers,
            members,
        }: CreateEventDto = createEvent;

        const event = await this.databaseService.event.create({
            data: {
                userId: userId,
                eventName,
                description,
            },
        });

        const eventId = event.id;

        const userEvents = [
            ...organizers?.map((userId) => ({
                userId,
                eventId,
                role: 'organizer',
            })),
            ...members?.map((userId) => ({
                userId,
                eventId,
                role: 'member',
            })),
        ];

        await this.databaseService.userEvents.createMany({
            data: userEvents,
        });

        return event;
    } catch (error) {
        console.error('Error creating event:', error);
        throw new HttpException('An error occurred while creating the event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

async getEvents(userId: number) {
    const userExists = await this.databaseService.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      console.log("user not found")
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
      const userEvents = await this.databaseService.userEvents.findMany({
          where: {
              userId,
          },
          select: {
              eventId: true,
              role: true,
          },
      });

      if (!userEvents || userEvents.length === 0) {
          return [];
      }

      const eventIds: number[] = userEvents.map((event: { eventId: any }) => event.eventId);

      const events = await this.databaseService.event.findMany({
          where: {
              id: {
                  in: eventIds,
              },
          },
      });

      const eventsWithRoles = events.map((event) => {
          const userEvent = userEvents.find((ue) => ue.eventId === event.id);
          return {
              ...event,
              role: userEvent?.role,
          };
      });

      return eventsWithRoles;
  
}


  async deleteEvent(eventId : number){
    const eventExists = await this.databaseService.event.findUnique({
      where: { id: eventId },
       });

      if (!eventExists) {
          throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }

      await this.databaseService.userEvents.deleteMany({
          where: { eventId },
      });

      await this.databaseService.event.delete({
          where: { id: eventId },
      });

      return `Event with ID ${eventId} deleted successfully`;
  }

  async updateEvent(eventId: number, updateEventDto: UpdateEventDto) {
    try {
      const { eventName, description, organizers, members } = updateEventDto;
  
      const eventExists = await this.databaseService.event.findUnique({
        where: { id: eventId },
      });
  
      if (!eventExists) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }
  
      const eventUpdateData: { eventName?: string; description?: string } = {};
      if (eventName !== undefined) eventUpdateData.eventName = eventName;
      if (description !== undefined) eventUpdateData.description = description;
  
      const updatedEvent = await this.databaseService.event.update({
        where: { id: eventId },
        data: eventUpdateData,
      });
  
      if (organizers !== undefined || members !== undefined) {
        await this.databaseService.userEvents.deleteMany({
          where: { eventId },
        });
  
        const userEvents = [
          ...(organizers?.map((userId) => ({
            userId,
            eventId,
            role: 'organizer',
          })) || []),
          ...(members?.map((userId) => ({
            userId,
            eventId,
            role: 'member',
          })) || []),
        ];
  
        if (userEvents.length > 0) {
          await this.databaseService.userEvents.createMany({
            data: userEvents,
          });
        }
      }
  
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}

