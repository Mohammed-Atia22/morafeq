import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to Morafeq API',
      version: '1.0',
      status: 'running',
      endpoints: {
        auth: '/auth',
        users: '/users',
        listings: '/listings',
        bookings: '/bookings',
        reviews: '/reviews',
        search: '/search',
        locations: '/locations',
      },
    };
  }
}
