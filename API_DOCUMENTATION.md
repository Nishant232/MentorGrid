# Growth Mentor Grid API Documentation

This document provides comprehensive documentation for the Growth Mentor Grid API endpoints.

## Base URL

- Development: `http://localhost:5000/api/v1`
- Production: `https://your-production-domain.com/api/v1`

## Authentication

Most endpoints require authentication using JWT (JSON Web Token).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All errors follow a standard format:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Error message description"
  }
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:
- `RATE_LIMIT_WINDOW`: Time window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum number of requests per window

---

## Authentication Endpoints

### Register User

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "mentee" // or "mentor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "mentee",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token"
  }
}
```

### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "mentee"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Refresh Token

```
POST /auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### Logout

```
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### Get Current User

```
GET /users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "mentee",
      "bio": "User bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "credits": 10
    }
  }
}
```

### Update User Profile

```
PUT /users/me
```

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Updated bio information",
  "password": "newPassword123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Updated",
      "email": "john@example.com",
      "bio": "Updated bio information"
    }
  }
}
```

### Upload Avatar

```
POST /users/me/avatar
```

**Request:**
Multipart form data with `avatar` field containing the image file.

**Response:**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://example.com/avatars/user_id.jpg"
  }
}
```

---

## Mentor Endpoints

### Create/Update Mentor Profile

```
PUT /mentors/profile
```

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "bio": "Experienced software engineer with 10+ years in the industry",
  "expertise": ["JavaScript", "React", "Node.js"],
  "hourlyRate": 50,
  "availability": {
    "monday": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "17:00"}],
    "tuesday": [{"start": "09:00", "end": "12:00"}],
    "wednesday": [],
    "thursday": [{"start": "14:00", "end": "17:00"}],
    "friday": [{"start": "09:00", "end": "12:00"}],
    "saturday": [],
    "sunday": []
  },
  "isAvailable": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "profile_id",
      "userId": "user_id",
      "title": "Senior Software Engineer",
      "bio": "Experienced software engineer with 10+ years in the industry",
      "expertise": ["JavaScript", "React", "Node.js"],
      "hourlyRate": 50,
      "availability": {
        "monday": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "17:00"}],
        "tuesday": [{"start": "09:00", "end": "12:00"}],
        "wednesday": [],
        "thursday": [{"start": "14:00", "end": "17:00"}],
        "friday": [{"start": "09:00", "end": "12:00"}],
        "saturday": [],
        "sunday": []
      },
      "isAvailable": true,
      "rating": 0,
      "reviewCount": 0
    }
  }
}
```

### Get Mentor Profile

```
GET /mentors/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "profile_id",
      "userId": {
        "_id": "user_id",
        "name": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "title": "Senior Software Engineer",
      "bio": "Experienced software engineer with 10+ years in the industry",
      "expertise": ["JavaScript", "React", "Node.js"],
      "hourlyRate": 50,
      "availability": {
        "monday": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "17:00"}],
        "tuesday": [{"start": "09:00", "end": "12:00"}],
        "wednesday": [],
        "thursday": [{"start": "14:00", "end": "17:00"}],
        "friday": [{"start": "09:00", "end": "12:00"}],
        "saturday": [],
        "sunday": []
      },
      "isAvailable": true,
      "rating": 4.5,
      "reviewCount": 10
    }
  }
}
```

### List Mentors

```
GET /mentors
```

**Query Parameters:**
- `expertise`: Filter by expertise (comma-separated)
- `minRating`: Minimum rating
- `maxRate`: Maximum hourly rate
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "mentors": [
      {
        "_id": "profile_id",
        "userId": {
          "_id": "user_id",
          "name": "John Doe",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "title": "Senior Software Engineer",
        "expertise": ["JavaScript", "React", "Node.js"],
        "hourlyRate": 50,
        "rating": 4.5,
        "reviewCount": 10
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

## Booking Endpoints

### Create Booking

```
POST /bookings
```

**Request Body:**
```json
{
  "mentorId": "mentor_user_id",
  "scheduledAt": "2023-01-15T14:00:00.000Z",
  "durationMinutes": 60,
  "notes": "I'd like to discuss career transition to tech"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": "mentor_user_id",
    "menteeId": "mentee_user_id",
    "scheduledAt": "2023-01-15T14:00:00.000Z",
    "durationMinutes": 60,
    "notes": "I'd like to discuss career transition to tech",
    "status": "pending",
    "creditsSpent": 2,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Confirm Booking

```
PUT /bookings/:id/confirm
```

**Request Body:**
```json
{
  "meetingLink": "https://zoom.us/j/123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": "mentor_user_id",
    "menteeId": "mentee_user_id",
    "scheduledAt": "2023-01-15T14:00:00.000Z",
    "durationMinutes": 60,
    "notes": "I'd like to discuss career transition to tech",
    "status": "confirmed",
    "meetingLink": "https://zoom.us/j/123456789",
    "creditsSpent": 2
  }
}
```

### Cancel Booking

```
PUT /bookings/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": "mentor_user_id",
    "menteeId": "mentee_user_id",
    "scheduledAt": "2023-01-15T14:00:00.000Z",
    "durationMinutes": 60,
    "status": "cancelled",
    "cancellationReason": "Schedule conflict",
    "cancelledBy": "user_id",
    "cancelledAt": "2023-01-10T00:00:00.000Z"
  }
}
```

### Complete Booking

```
PUT /bookings/:id/complete
```

**Request Body:**
```json
{
  "recordingUrl": "https://example.com/recordings/session123.mp4" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": "mentor_user_id",
    "menteeId": "mentee_user_id",
    "scheduledAt": "2023-01-15T14:00:00.000Z",
    "durationMinutes": 60,
    "status": "completed",
    "completedAt": "2023-01-15T15:00:00.000Z",
    "recordingUrl": "https://example.com/recordings/session123.mp4"
  }
}
```

### Add Feedback

```
PUT /bookings/:id/feedback
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent session, very helpful!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": "mentor_user_id",
    "menteeId": "mentee_user_id",
    "status": "completed",
    "feedback": {
      "mentee": {
        "rating": 5,
        "comment": "Excellent session, very helpful!",
        "createdAt": "2023-01-15T16:00:00.000Z"
      }
    }
  }
}
```

### List Bookings

```
GET /bookings
```

**Query Parameters:**
- `role`: "mentor" or "mentee" (required)
- `status`: Filter by status (pending, confirmed, completed, cancelled)
- `from`: Start date filter (ISO format)
- `to`: End date filter (ISO format)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "booking_id",
        "mentorId": {
          "_id": "mentor_user_id",
          "name": "Mentor Name",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "menteeId": {
          "_id": "mentee_user_id",
          "name": "Mentee Name",
          "avatarUrl": "https://example.com/avatar2.jpg"
        },
        "scheduledAt": "2023-01-15T14:00:00.000Z",
        "durationMinutes": 60,
        "status": "confirmed",
        "meetingLink": "https://zoom.us/j/123456789"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Booking

```
GET /bookings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "mentorId": {
      "_id": "mentor_user_id",
      "name": "Mentor Name",
      "email": "mentor@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "menteeId": {
      "_id": "mentee_user_id",
      "name": "Mentee Name",
      "email": "mentee@example.com",
      "avatarUrl": "https://example.com/avatar2.jpg"
    },
    "scheduledAt": "2023-01-15T14:00:00.000Z",
    "durationMinutes": 60,
    "notes": "I'd like to discuss career transition to tech",
    "status": "confirmed",
    "meetingLink": "https://zoom.us/j/123456789",
    "creditsSpent": 2,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "feedback": {
      "mentee": {
        "rating": 5,
        "comment": "Excellent session, very helpful!",
        "createdAt": "2023-01-15T16:00:00.000Z"
      },
      "mentor": {
        "rating": 5,
        "comment": "Great mentee, came prepared with questions",
        "createdAt": "2023-01-15T16:30:00.000Z"
      }
    }
  }
}
```

---

## Message Endpoints

### Send Message

```
POST /messages
```

**Request Body:**
```json
{
  "receiverId": "user_id",
  "content": "Hello, I'd like to schedule a session",
  "bookingId": "booking_id" // Optional, to associate with a booking
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": {
      "_id": "message_id",
      "sender": "sender_user_id",
      "receiver": "receiver_user_id",
      "content": "Hello, I'd like to schedule a session",
      "bookingId": "booking_id",
      "read": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Conversation

```
GET /messages/:userId
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

**Response:**
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "sender_user_id",
          "name": "Sender Name",
          "avatar": "https://example.com/avatar.jpg"
        },
        "receiver": {
          "_id": "receiver_user_id",
          "name": "Receiver Name",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "content": "Hello, I'd like to schedule a session",
        "bookingId": "booking_id",
        "read": true,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### List Conversations

```
GET /messages/conversations
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "user": {
          "_id": "user_id",
          "name": "User Name",
          "avatar": "https://example.com/avatar.jpg"
        },
        "lastMessage": {
          "_id": "message_id",
          "content": "Hello, I'd like to schedule a session",
          "createdAt": "2023-01-01T00:00:00.000Z"
        },
        "unreadCount": 3
      }
    ]
  }
}
```

### Delete Message

```
DELETE /messages/:messageId
```

**Response:**
```
Status: 204 No Content
```

### Get Unread Count

```
GET /messages/unread
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "unreadCount": 5
  }
}
```

---

## Credit Endpoints

### Purchase Credits

```
POST /credits/purchase
```

**Request Body:**
```json
{
  "quantity": 10,
  "paymentMethod": "stripe",
  "paymentId": "stripe_payment_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "type": "credit_purchase",
      "amount": 50,
      "status": "completed",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "creditBalance": 15
  }
}
```

### Get Credit History

```
GET /credits/history
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `type`: Filter by transaction type (purchase, use, refund)

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 15,
    "history": [
      {
        "type": "purchase",
        "amount": 10,
        "transactionId": {
          "_id": "transaction_id",
          "type": "credit_purchase",
          "amount": 50,
          "status": "completed",
          "createdAt": "2023-01-01T00:00:00.000Z"
        },
        "createdAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "type": "use",
        "amount": -2,
        "bookingId": "booking_id",
        "transactionId": {
          "_id": "transaction_id2",
          "type": "credit_use",
          "amount": 2,
          "status": "completed",
          "createdAt": "2023-01-02T00:00:00.000Z"
        },
        "createdAt": "2023-01-02T00:00:00.000Z"
      }
    ],
    "totalPages": 1,
    "currentPage": 1
  }
}
```

---

## Notification Endpoints

### Get Notifications

```
GET /notifications
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `read`: Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "type": "booking_confirmed",
        "title": "Booking Confirmed",
        "message": "Your session has been confirmed by the mentor",
        "data": {
          "bookingId": "booking_id",
          "meetingLink": "https://zoom.us/j/123456789"
        },
        "read": false,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Mark Notifications as Read

```
PUT /notifications/read
```

**Request Body:**
```json
{
  "notificationIds": ["notification_id1", "notification_id2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modifiedCount": 2
  }
}
```

### Delete Notifications

```
DELETE /notifications
```

**Request Body:**
```json
{
  "notificationIds": ["notification_id1", "notification_id2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 2
  }
}
```

---

## Socket.IO Events

The application uses Socket.IO for real-time communication. Here are the available events:

### Client Events (Emitted by client)

- `authenticate`: Authenticate socket connection with JWT token
  ```javascript
  socket.emit('authenticate', 'jwt_token');
  ```

- `join-room`: Join a specific chat room (usually based on user ID)
  ```javascript
  socket.emit('join-room', 'user_id');
  ```

- `join-booking-room`: Join a booking-specific room
  ```javascript
  socket.emit('join-booking-room', 'booking_id');
  ```

- `private-message`: Send a private message to another user
  ```javascript
  socket.emit('private-message', {
    receiverId: 'receiver_user_id',
    content: 'Hello there!',
    bookingId: 'booking_id' // Optional
  });
  ```

- `typing`: Indicate that the user is typing a message
  ```javascript
  socket.emit('typing', 'receiver_user_id');
  ```

- `stop-typing`: Indicate that the user has stopped typing
  ```javascript
  socket.emit('stop-typing', 'receiver_user_id');
  ```

- `read-receipt`: Mark messages as read
  ```javascript
  socket.emit('read-receipt', 'sender_user_id');
  ```

- `get-online-status`: Check if a user is online
  ```javascript
  socket.emit('get-online-status', 'user_id');
  ```

### Server Events (Received by client)

- `authenticated`: Authentication successful
  ```javascript
  socket.on('authenticated', (userData) => {
    console.log('Authenticated as:', userData);
  });
  ```

- `auth-error`: Authentication failed
  ```javascript
  socket.on('auth-error', (error) => {
    console.error('Authentication error:', error);
  });
  ```

- `user-online`: User came online
  ```javascript
  socket.on('user-online', (userId) => {
    console.log('User online:', userId);
  });
  ```

- `user-offline`: User went offline
  ```javascript
  socket.on('user-offline', (userId) => {
    console.log('User offline:', userId);
  });
  ```

- `newMessage`: Received a new message
  ```javascript
  socket.on('newMessage', (message) => {
    console.log('New message:', message);
  });
  ```

- `typing`: Someone is typing to you
  ```javascript
  socket.on('typing', (userId) => {
    console.log('User is typing:', userId);
  });
  ```

- `stop-typing`: Someone stopped typing to you
  ```javascript
  socket.on('stop-typing', (userId) => {
    console.log('User stopped typing:', userId);
  });
  ```

- `notification`: Received a new notification
  ```javascript
  socket.on('notification', (notification) => {
    console.log('New notification:', notification);
  });
  ```

- `online-status`: Response to online status request
  ```javascript
  socket.on('online-status', ({ userId, isOnline }) => {
    console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
  });
  ```