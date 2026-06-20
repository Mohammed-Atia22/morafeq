You are a senior frontend engineer working on an existing accommodation-booking platform called **Morafeq**.

Your task is to inspect the current frontend architecture first, then implement the complete **Admin Dispute Management and Private Dispute Chat System** using the backend APIs and Socket.IO contract described below.

Do not rewrite the application or replace its existing architecture. Reuse the current:

* Routing system
* Authentication state
* API client
* UI components
* Design system
* State-management solution
* Error handling
* Loading components
* Toast/notification system
* Arabic/RTL support, if already enabled

The backend is already implemented. Do not modify or invent backend endpoints.

---

# 1. Backend connection

Default development URLs:

```env
API_BASE_URL=http://localhost:3001/api/v1
SOCKET_BASE_URL=http://localhost:3001
```

If the project already has environment-variable names, reuse them instead of creating duplicate variables.

All protected REST requests must send:

```http
Authorization: Bearer <accessToken>
```

The Socket.IO connection uses the raw access token inside the handshake:

```ts
import { io } from 'socket.io-client';

const socket = io(`${SOCKET_BASE_URL}/chat`, {
  auth: {
    token: accessToken,
  },
  withCredentials: true,
});
```

The Socket.IO namespace is:

```text
/chat
```

Do not use the normal chat events for dispute conversations.

---

# 2. Roles

The system has three relevant roles:

```text
ADMIN
GUEST
HOST
```

Permissions:

* `ADMIN` can view all disputes and private dispute conversations.
* `GUEST` can only view and reply inside their own private dispute conversation.
* `HOST` can only view and reply inside their own private dispute conversation.
* A guest must never see the host’s private conversation.
* A host must never see the guest’s private conversation.
* The original guest-host chat is evidence and must be read-only for the admin.

The backend already enforces these permissions, but the frontend must also hide inaccessible actions and routes.

---

# 3. Required Admin pages

Implement or update these admin views.

## A. Admin disputes list

Suggested route:

```text
/admin/disputes
```

Use:

```http
GET /admin/disputes
```

Supported query parameters:

```text
page
limit
status
```

Examples:

```http
GET /admin/disputes?page=1&limit=10
GET /admin/disputes?status=DISPUTED&page=1&limit=10
```

Expected general response:

```ts
interface PaginatedDisputesResponse {
  data: AdminDisputeListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

The list must support:

* Loading state
* Empty state
* Error state
* Pagination
* Filtering by dispute/booking status
* Opening a dispute details page
* Responsive layout

Possible statuses include:

```text
DISPUTED
CANCELLED_AFTER_DISPUTE
```

Do not assume these are the only possible statuses. Render unknown statuses safely.

Each dispute card or row should show the most useful available fields:

* Booking ID
* Booking status
* Dispute reason
* Dispute date
* Guest name
* Listing title
* Listing cover image
* City/governorate when available
* Whether the dispute is unresolved or already resolved

---

## B. Admin dispute details

Suggested route:

```text
/admin/disputes/:bookingId
```

Use:

```http
GET /admin/disputes/:bookingId
```

Example:

```http
GET /admin/disputes/3
```

The response contains these main sections:

```ts
interface AdminDisputeDetailResponse {
  booking: {
    id: number;
    status: string;
    preferredMoveInDate: string | null;
    guestMessage: string | null;
    agreedAmount: number | null;
    hostResponseNote: string | null;
    disputeReason: string | null;
    disputeDescription: string | null;
    disputeResolution: string | null;
    acceptedAt: string | null;
    confirmedAt: string | null;
    disputedAt: string | null;
    disputeResolvedAt: string | null;
    cancelledAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  guest: UserWithDisputeReviews;
  host: UserWithDisputeReviews;
  listing: ListingWithReviews;
  payment: PaymentDisputeDetails | null;
}
```

The page should be divided into clear sections or tabs:

1. Dispute overview
2. Booking timeline
3. Payment breakdown
4. Listing details and photos
5. Guest profile and ratings
6. Host profile and ratings
7. Listing ratings and reviews
8. Original guest-host conversation
9. Private admin-to-guest conversation
10. Private admin-to-host conversation

Do not place all data in one unstructured block.

---

# 4. Admin profile data

Both `guest` and `host` may contain:

```ts
interface UserWithDisputeReviews {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  verificationStatus: string;
  trustScore: number;
  isActive: boolean;
  createdAt: string;

  ratingSummary: {
    totalReviews: number;
    averageRating: number;
    lowRatingsCount: number;
    hiddenReviewsCount: number;
  };

  reviews: UserReview[];
}
```

Important:

* The phone is already decrypted by the backend for the admin.
* Display the phone only on admin-authorized pages.
* Do not expose it in normal guest or host pages.
* Handle `null` values.
* Show verification status, trust score and account activity.
* Highlight low ratings and hidden reviews because they may help the admin investigate the dispute.
* Hidden reviews are visible to the admin and should have a clear “hidden” badge.

Example review:

```ts
interface UserReview {
  id: number;
  bookingId: number;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;

  reviewer: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };

  listing?: {
    id: number;
    title: string;
  };
}
```

Render ratings as stars out of five.

---

# 5. Listing ratings

The listing is rated separately from the host.

```ts
interface ListingWithReviews {
  id: number;
  title: string;
  description: string;
  city: string;
  governorate: string;
  country: string;
  monthlyRent: number;
  depositAmount: number;
  status: string;
  propertyType: string;
  roomType: string;

  photos: Array<{
    id: number;
    url: string;
    isCover: boolean;
    sortOrder: number;
  }>;

  ratingSummary: {
    totalReviews: number;
    averageRating: number;
    averageCleanliness: number;
    averageLocation: number;
    averageAccuracy: number;
    averageValue: number;
  };

  reviews: Array<{
    id: number;
    bookingId: number;
    rating: number;
    cleanliness: number | null;
    location: number | null;
    accuracy: number | null;
    value: number | null;
    comment: string | null;
    isVisible: boolean;
    createdAt: string;

    reviewer: {
      id: number;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  }>;
}
```

Display:

* Overall rating
* Cleanliness
* Location
* Accuracy
* Value
* Listing reviews
* Listing images

Do not mix listing ratings with host ratings.

---

# 6. Payment details

The dispute detail may contain payment data.

```ts
interface PaymentDisputeDetails {
  id: number;
  status: string;
  currency: string;
  paymentMethod: string | null;

  paidAt: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  settledAt: string | null;

  refundReason: string | null;

  amounts: {
    totalAmount: number;
    rentAmount: number;
    securityDepositAmount: number;
    platformFee: number;
    hostPayoutAmount: number;
    guestRefundAmount: number;
    hostCompensationAmount: number;
    currency: string;
  };
}
```

Use the values under `payment.amounts` for display because these values are already converted to EGP.

Do not divide them by 100 again.

Clearly display:

* Rent
* Security deposit
* Service/platform fee
* Total paid
* Guest refund
* Host compensation
* Host payout
* Payment status

Handle a missing payment object gracefully.

---

# 7. Original guest-host conversation

The original conversation is evidence only.

Use:

```http
GET /admin/disputes/:bookingId/messages
```

Pagination:

```http
GET /admin/disputes/:bookingId/messages?page=1&limit=20
```

Expected response:

```ts
interface OriginalDisputeConversationResponse {
  conversation: {
    id: number;
    guestId: number;
    hostId: number;
    listingId: number;
    createdAt: string;
    updatedAt: string;
    readOnly: true;
  } | null;

  booking: {
    id: number;
    listingId: number;
    listingTitle: string;
    guestId: number;
    hostId: number;
  };

  data: Array<{
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    senderType: 'GUEST' | 'HOST' | 'UNKNOWN';

    sender: {
      id: number;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      role: string;
    };
  }>;

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
```

Requirements:

* Display this conversation as read-only.
* Do not show a message input.
* Show a clear “Evidence / Original conversation” label.
* Show sender identity and date.
* If `conversation` is `null`, show an empty-state message explaining that no original chat exists.
* Content may contain masked phone numbers. Display backend content as returned.

Pagination behavior:

* Page 1 contains the newest message chunk.
* Messages inside each returned page are ordered chronologically.
* When loading page 2 or later, prepend older messages before the existing messages.

---

# 8. Opening private admin conversations

The admin has two separate private conversations:

```text
Admin ↔ Guest
Admin ↔ Host
```

They must never be combined.

Use:

```http
POST /admin/disputes/:bookingId/conversations
```

To open/create the guest conversation:

```json
{
  "participantType": "GUEST"
}
```

To open/create the host conversation:

```json
{
  "participantType": "HOST"
}
```

This endpoint uses an upsert.

Calling it multiple times must reuse the same conversation.

Expected response:

```ts
interface OpenPrivateConversationResponse {
  message: string;

  conversation: {
    id: number;
    bookingId: number;
    participantId: number;
    participantType: 'GUEST' | 'HOST';
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;

    participant: {
      id: number;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      email: string;
      role: string;
      verificationStatus: string;
    };

    booking: {
      id: number;
      status: string;
      disputeReason: string | null;
      disputedAt: string | null;
      listing: {
        id: number;
        title: string;
      };
    };

    _count: {
      messages: number;
    };
  };
}
```

On the admin dispute details page:

* Add “Message Guest” and “Message Host” actions.
* Opening either tab should call this endpoint once if the conversation ID is not known.
* Store the returned conversation ID.
* Do not use participant IDs supplied by the client to create conversations.
* The backend determines the correct guest or host from the booking.

---

# 9. Admin private conversation history

Use:

```http
GET /admin/dispute-conversations/:conversationId/messages
```

Pagination:

```http
GET /admin/dispute-conversations/:conversationId/messages?page=1&limit=50
```

Expected response:

```ts
interface AdminPrivateConversationMessagesResponse {
  conversation: {
    id: number;
    bookingId: number;
    participantId: number;
    participantType: 'GUEST' | 'HOST';
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;

    participant: {
      id: number;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      email: string;
      role: string;
      verificationStatus: string;
    };

    booking: {
      id: number;
      status: string;
      disputeReason: string | null;
      disputedAt: string | null;
      listing: {
        id: number;
        title: string;
      };
    };
  };

  data: DisputeMessage[];

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
```

Message type:

```ts
interface DisputeMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  senderType: 'ADMIN' | 'GUEST' | 'HOST' | 'UNKNOWN';

  sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
}
```

When the admin opens this REST endpoint, unread messages from the guest or host are automatically marked as read by the backend.

---

# 10. Admin sends a private message

Use:

```http
POST /admin/dispute-conversations/:conversationId/messages
```

Body:

```json
{
  "content": "مرحبًا، نحتاج منك توضيح تفاصيل المشكلة وإرسال أي أدلة متاحة."
}
```

Expected response:

```ts
{
  message: string;
  data: DisputeMessage & {
    senderType: 'ADMIN';
    recipient: {
      id: number;
      type: 'GUEST' | 'HOST';
    };
  };
}
```

Validation:

* Content is required.
* Content cannot be empty after trimming.
* Maximum length is 2000 characters.
* If the conversation is closed, the API returns HTTP 400.

The primary real-time send mechanism should be Socket.IO, while REST may be retained as a fallback.

---

# 11. Close private dispute conversation

Only the admin can close a conversation.

Use:

```http
PATCH /admin/dispute-conversations/:conversationId/close
```

No body.

Expected response:

```ts
{
  message: string;
  conversation: {
    id: number;
    bookingId: number;
    participantId: number;
    participantType: 'GUEST' | 'HOST';
    isClosed: true;
    createdAt: string;
    updatedAt: string;
  };
}
```

Frontend behavior after closing:

* Show a “Closed” badge.
* Disable the message input.
* Disable the send button.
* Keep message history visible.
* Show a clear message that the investigation conversation has ended.
* Any backend HTTP 400 response saying the conversation is closed must be handled safely.
* Do not remove the conversation from history.

---

# 12. Guest and host dispute-chat pages

Implement or update user-facing routes such as:

```text
/dispute-chat
/dispute-chat/:conversationId
```

Adapt them to the existing router.

## A. List current user conversations

Use:

```http
GET /dispute-chat/conversations
```

Expected response:

```ts
interface MyDisputeConversationsResponse {
  data: Array<{
    id: number;
    bookingId: number;
    participantId: number;
    participantType: 'GUEST' | 'HOST';
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;

    booking: {
      id: number;
      status: string;
      disputeReason: string | null;
      disputedAt: string | null;

      listing: {
        id: number;
        title: string;
        photos: Array<{
          id: number;
          url: string;
        }>;
      };
    };

    lastMessage: {
      id: number;
      senderId: number;
      content: string;
      isRead: boolean;
      readAt: string | null;
      createdAt: string;

      sender: {
        id: number;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: string;
      };
    } | null;

    unreadCount: number;

    _count: {
      messages: number;
    };
  }>;

  meta: {
    total: number;
  };
}
```

Show:

* Listing image
* Listing title
* Last message
* Last-message time
* Unread count badge
* Conversation closed state
* Dispute/booking status

The backend returns only conversations belonging to the authenticated user.

---

## B. User opens their own conversation

Use:

```http
GET /dispute-chat/conversations/:conversationId/messages
```

Pagination:

```http
GET /dispute-chat/conversations/:conversationId/messages?page=1&limit=50
```

Expected response:

```ts
interface UserPrivateConversationMessagesResponse {
  conversation: {
    id: number;
    bookingId: number;
    participantId: number;
    participantType: 'GUEST' | 'HOST';
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;

    booking: {
      id: number;
      status: string;
      disputeReason: string | null;
      disputedAt: string | null;

      listing: {
        id: number;
        title: string;
        photos: Array<{
          id: number;
          url: string;
        }>;
      };
    };
  };

  data: Array<
    DisputeMessage & {
      isMine: boolean;
    }
  >;

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
```

When the user opens this REST endpoint, unread admin messages are automatically marked as read.

The backend returns HTTP 403 if a guest or host tries to open another person’s conversation.

Handle 403 by:

* Showing an access-denied page or toast.
* Redirecting to the user’s conversation list.
* Never rendering partial protected data.

---

## C. Guest or host replies

Use:

```http
POST /dispute-chat/conversations/:conversationId/messages
```

Body:

```json
{
  "content": "المشكلة بدأت عندما طلب صاحب السكن مبلغًا إضافيًا غير المتفق عليه."
}
```

Expected response:

```ts
{
  message: string;

  data: DisputeMessage & {
    senderType: 'GUEST' | 'HOST';
    recipientType: 'ADMIN';
  };
}
```

The backend returns:

* HTTP 403 if the conversation does not belong to the current user.
* HTTP 400 if the conversation is closed.
* Validation errors for empty or overly long messages.

---

# 13. Socket.IO dispute events

Use one shared authenticated Socket.IO instance.

Do not create one socket connection per component.

Reconnect and rejoin the active room after disconnection.

## Connect

```ts
const socket = io(`${SOCKET_BASE_URL}/chat`, {
  auth: {
    token: accessToken,
  },
  withCredentials: true,
});
```

Possible authentication error event:

```ts
socket.on('socketError', (error) => {
  // Handle unauthorized socket connection.
});
```

---

## Join a dispute conversation

Emit:

```text
joinDisputeConversation
```

Payload:

```ts
{
  conversationId: number;
}
```

Example:

```ts
socket.emit(
  'joinDisputeConversation',
  { conversationId },
  (response) => {
    console.log(response);
  },
);
```

Success response:

```ts
{
  success: true;
  conversationId: number;
  roomName: string;
  accessType: 'ADMIN' | 'GUEST' | 'HOST';
  isClosed: boolean;
}
```

Backend room name:

```text
dispute-conversation:<conversationId>
```

Never use:

```text
conversation:<conversationId>
```

That room belongs to the normal guest-host chat.

---

## Send a real-time dispute message

Emit:

```text
sendDisputeMessage
```

Payload:

```ts
{
  conversationId: number;
  content: string;
}
```

Example:

```ts
socket.emit(
  'sendDisputeMessage',
  {
    conversationId,
    content,
  },
  (response) => {
    if (!response?.success) {
      // Show send error.
    }
  },
);
```

The message is:

1. Authorized
2. Validated
3. Saved in the database
4. Broadcast to the dispute room

Listen for:

```text
newDisputeMessage
```

```ts
socket.on('newDisputeMessage', (message: DisputeMessage) => {
  // Add or reconcile the message.
});
```

Important:

* The sender also receives `newDisputeMessage`.
* The callback also contains the saved message.
* Avoid adding the same message twice.
* Use `message.id` to deduplicate.
* Prefer the room event as the source of truth and use the callback only for success/error.
* Alternatively reconcile an optimistic temporary message with the server message ID.

Do not trust an `isMine` property from the Socket.IO event.

Calculate it in the frontend:

```ts
const isMine = message.senderId === currentUser.id;
```

---

## Mark dispute messages as read

Emit:

```text
markDisputeMessagesAsRead
```

Payload:

```ts
{
  conversationId: number;
}
```

Example:

```ts
socket.emit(
  'markDisputeMessagesAsRead',
  { conversationId },
  (response) => {
    console.log(response);
  },
);
```

Listen for:

```text
disputeMessagesRead
```

Response/event shape:

```ts
interface DisputeMessagesReadEvent {
  success?: boolean;
  conversationId: number;
  readerId: number;
  readerType: 'ADMIN' | 'GUEST' | 'HOST';
  readAt: string;
  updatedMessagesCount: number;
}
```

Correct frontend update rules:

* If `readerType === 'ADMIN'`, mark messages whose `senderType` is `GUEST` or `HOST` as read.
* If `readerType === 'GUEST'` or `readerType === 'HOST'`, mark messages whose `senderType` is `ADMIN` as read.

Do not simply mark every message with `senderId !== readerId` as read because the system may have multiple admin accounts.

Update:

```ts
isRead = true
readAt = event.readAt
```

Also update the unread badge in the conversations list.

---

# 14. Socket lifecycle requirements

Implement the following safely:

* One socket singleton/provider.
* Connect only when an authenticated token exists.
* Disconnect on logout.
* Reconnect when the token changes.
* Join the active dispute room after opening a chat.
* Rejoin after socket reconnect.
* Remove event listeners on component unmount.
* Avoid registering the same listener multiple times.
* Ignore messages belonging to another conversation.
* Deduplicate messages by `message.id`.
* Fall back to REST history if the socket is disconnected.
* Show connection status if the existing UI supports it.

Do not log access tokens.

---

# 15. Message UI behavior

For both admin and user dispute chats:

* Messages sent by the current user appear on one side.
* Messages received appear on the other side.
* Show sender identity when useful.
* Show timestamp.
* Show read status for sent messages.
* Keep scroll near the bottom for new messages.
* Preserve the scroll position when older pages are prepended.
* Disable sending while content is empty.
* Enforce the 2000-character limit client-side.
* Prevent repeated sends while a send operation is in progress.
* Handle Arabic text correctly.
* Support multiline messages.
* Handle closed conversations.

Use:

```ts
message.senderId === currentUser.id
```

to decide message alignment.

---

# 16. Required frontend API layer

Create or extend organized API functions similar to:

```ts
getAdminDisputes(params)
getAdminDisputeDetail(bookingId)
getOriginalDisputeMessages(bookingId, params)

openAdminDisputeConversation(
  bookingId,
  participantType,
)

getAdminPrivateDisputeMessages(
  conversationId,
  params,
)

sendAdminPrivateDisputeMessage(
  conversationId,
  content,
)

closeAdminDisputeConversation(
  conversationId,
)

getMyDisputeConversations()

getMyDisputeConversationMessages(
  conversationId,
  params,
)

sendMyDisputeMessage(
  conversationId,
  content,
)
```

Use the existing API client and interceptors.

Do not scatter raw `fetch` or Axios calls throughout components.

---

# 17. Recommended frontend component structure

Adapt names to the existing project.

Possible admin components:

```text
AdminDisputesPage
AdminDisputesTable
AdminDisputeFilters
AdminDisputeDetailsPage
DisputeOverviewCard
DisputePaymentBreakdown
DisputeBookingTimeline
DisputePartyProfile
DisputeRatingSummary
DisputeReviewsList
OriginalConversationEvidence
AdminPrivateDisputeChat
CloseConversationButton
```

Possible user components:

```text
MyDisputeConversationsPage
DisputeConversationList
DisputeConversationPage
DisputeMessageList
DisputeMessageBubble
DisputeMessageInput
DisputeUnreadBadge
```

Shared:

```text
RatingStars
EmptyState
ErrorState
LoadingSkeleton
PaginationControls
UserAvatar
StatusBadge
```

Do not create duplicate components when suitable equivalents already exist.

---

# 18. Loading and error handling

Handle at least:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
Socket connection failure
Socket authorization failure
Closed conversation
Empty message
Message too long
No original conversation
No private messages
No disputes
```

Important behaviors:

* `401`: use the existing logout/refresh-token behavior.
* `403`: show access denied and return to a safe page.
* `404`: show not found.
* `400` closed conversation: update local `isClosed` state and disable input.
* Network error: show retry option.
* Socket failure: keep REST history available.

---

# 19. Security requirements

* Never expose `PHONE_CRYPTO_SECRET`.
* Never decrypt phone numbers in the frontend.
* Never log access tokens.
* Never trust route parameters without backend confirmation.
* Do not allow users to choose arbitrary `participantId`.
* Use conversation IDs returned by authorized APIs.
* Hide admin routes from non-admin users.
* Hide private dispute chats from unrelated users.
* Do not allow sending messages in the original evidence chat.
* Escape/render message content as plain text.
* Do not use unsafe HTML rendering for chat content.

---

# 20. Pagination details

For all message history endpoints:

```text
page starts at 1
limit maximum is 100
```

The backend returns the newest page first, but messages within that page are in chronological order.

Correct loading behavior:

```text
Initial page 1:
show returned messages normally

Load page 2:
prepend page 2 messages before page 1 messages

Load page 3:
prepend page 3 before the existing messages
```

Use:

```ts
meta.hasNextPage
```

to determine whether older messages exist.

Do not append older messages to the bottom.

---

# 21. Acceptance criteria

The implementation is complete only when all of these work:

1. Admin can view paginated disputes.
2. Admin can filter disputes by status.
3. Admin can open one dispute.
4. Admin can view booking, payment, listing and timeline data.
5. Admin can view the decrypted guest and host phone numbers.
6. Admin can see guest ratings.
7. Admin can see host ratings.
8. Admin can see listing ratings separately.
9. Admin can see hidden and low-rating reviews.
10. Admin can view the original guest-host chat as read-only evidence.
11. Admin can open a separate private chat with the guest.
12. Admin can open a separate private chat with the host.
13. Guest and host private chats never share messages.
14. Admin can send messages through Socket.IO.
15. Guest can receive and reply in real time.
16. Host can receive and reply in real time.
17. Guest cannot open or send in the host conversation.
18. Host cannot open or send in the guest conversation.
19. REST history remains available.
20. New messages do not duplicate.
21. Unread counts update correctly.
22. Read receipts update through `disputeMessagesRead`.
23. Closed conversations remain visible but cannot send.
24. Loading, empty, error and access-denied states are handled.
25. Socket listeners are cleaned up.
26. Active rooms are rejoined after reconnect.
27. No secret or token is logged or exposed.
28. Existing normal guest-host chat continues working without regression.

---

# 22. Final delivery requirements

Before coding:

1. Inspect the current frontend folder structure.
2. Identify the current router.
3. Identify the current auth store/context.
4. Identify the current API client.
5. Identify whether Socket.IO is already initialized.
6. Identify the existing design system and reusable components.
7. Present a concise implementation plan.
8. Then implement in small, reviewable steps.

After coding:

1. List all files created.
2. List all files modified.
3. Explain the new routes.
4. Explain the API integration.
5. Explain the Socket.IO integration.
6. Explain how duplicate messages are prevented.
7. Explain how read receipts are handled.
8. Explain how admin, guest and host permissions are enforced.
9. Run the available lint, type-check and build commands.
10. Fix all introduced TypeScript errors.
11. Do not claim completion if build or type-check errors remain.

Do not change backend code unless explicitly instructed.

Do not invent missing endpoints. If an expected backend field is absent, report the exact mismatch instead of fabricating data.