# ТЗ — Digital Library / Book Reading Platform

## 1. Номи лоиҳа

**Digital Library** — платформаи муосир барои хондани китобҳо, ҷустуҷӯ ва интихоби китоб, муоширати байни корбарон, гурӯҳҳои китобхонӣ, тестҳои интеллектуалӣ ва зангҳои аудиоӣ/видеоӣ.

Интерфейси асосӣ бояд ба дизайни пешниҳодшуда монанд бошад: **Dark futuristic / 1980s digital interface**, background-и торик, neon effect, cyan/blue accents, glowing cards ва animation-ҳои мулоим.

---

## 2. Технологияҳо

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Django ORM
- Celery — барои task-ҳои background
- Redis — cache ва WebSocket infrastructure
- Django Channels — real-time communication
- WebSocket — chat ва notifications
- WebRTC — audio/video calls
- SMTP — фиристодани email code

### Frontend

- React
- JavaScript
- HTML5
- CSS3
- React Router
- Axios / Fetch API
- WebSocket client
- WebRTC
- Responsive Design

### API Documentation

- drf-spectacular
- Swagger
- ReDoc

---

## 3. Системаҳои асосӣ

Платформа аз чунин қисмҳо иборат мешавад:

1. Authentication
2. User Profile
3. Home
4. Book Library
5. Book Details
6. Categories
7. Search
8. Favorites
9. Reading System
10. Reading History
11. Recommendations
12. Chat
13. Audio Call
14. Video Call
15. Groups
16. Group Book Game
17. AI Quiz
18. Notifications
19. Settings
20. Admin Panel

---

## 4. HOME PAGE

Саҳифаи Home ҳамон интерфейсе мебошад, ки дар screenshot нишон дода шудааст.

### Қисмҳо

- Sidebar
- Logo
- Search
- Login/Profile
- Digital Archive title
- Book carousel
- Previous / Next buttons
- Book counter
- GET STARTED
- EXPLORE

### Sidebar

Sidebar чунин меню дошта бошад:

- Home
- Library
- Categories
- Favorites
- History
- Groups
- Messages
- Notifications
- Settings
- Profile
- Logout

---

## 5. AUTHENTICATION

### Register

Корбар бояд тавонад аккаунт созад.

Fieldҳо:

- username
- first_name
- last_name
- email
- password
- confirm_password

Пас аз registration ба email-и корбар **verification code** фиристода шавад.

Агар code дуруст бошад, email тасдиқ ва аккаунт фаъол карда шавад.

---

## 6. LOGIN

Login бо:

- Email / Username
- Password

Агар маълумот дуруст бошад:

- JWT access token
- JWT refresh token

Корбар ба Home равона шавад.

---

## 7. FORGOT PASSWORD

Корбар **Forgot password?**-ро интихоб мекунад.

Email ворид мекунад.

Backend code мефиристад.

Сипас:

1. Email
2. Verification code
3. New password
4. Confirm password

Пас аз тағйир додани password email notification низ фиристода шавад.

---

## 8. PROFILE

Ҳар корбар Profile дошта бошад.

Маълумот:

- Avatar
- Username
- Full name
- Bio
- Email
- Join date
- Books read
- Favorite books
- Reading statistics

Корбар метавонад:

- avatar иваз кунад
- username иваз кунад
- bio иваз кунад
- password иваз кунад

---

## 9. LIBRARY PAGE

Саҳифаи асосии китобҳо.

Китобҳо ҳамчун Card нишон дода мешаванд.

Ҳар Card:

- Cover image
- Title
- Author
- Year
- Category
- Rating
- Favorite button

### Filter

- All
- Fiction
- Fantasy
- History
- Science
- Romance
- Mystery
- Adventure
- Psychology
- Business
- Programming

### Sort

- Newest
- Oldest
- Popular
- Highest rated
- Most read

---

## 10. BOOK CARD

Ҳар китоб бояд ҳатман маълумоти асосӣ дошта бошад:

- Cover
- Title
- Author
- Publication year
- Category
- Language
- Pages
- Rating

**Book cover ҳатмӣ аст.**

---

## 11. BOOK DETAILS PAGE

Вақте корбар китобро зер мекунад, саҳифаи махсус кушода шавад.

### Қисми боло

- Large book cover
- Title
- Author
- Rating
- Publication year
- Category
- Language
- Pages

Buttons:

- READ NOW
- ADD TO FAVORITES

### Description

Маълумоти пурраи китоб.

### About Author

Маълумот дар бораи муаллиф.

### Book Information

- Author
- Publication
- Year
- Language
- Pages
- Category
- ISBN
- Rating

### Similar Books

Дар поён **You may also like** ва китобҳои ҳамон category нишон дода шаванд.

---

## 12. INTEREST SYSTEM

Агар корбар китоберо интихоб кунад, система категорияи онро муайян кунад.

Масалан:

**Harry Potter**

Category:

- Fantasy
- Adventure

Система пешниҳод кунад:

**More books you may like**

ва китобҳои ҳамон категорияро нишон диҳад.

Recommendation метавонад аз рӯи:

- books viewed
- books read
- favorites
- categories

interest-и корбарро муайян кунад.

---

## 13. SEARCH

Search бояд китобҳоро ҷустуҷӯ кунад.

Ҷустуҷӯ аз рӯи:

- title
- author
- category
- year
- ISBN

Search бо debounce кор кунад.

---

## 14. FAVORITES

Корбар метавонад китобро ба Favorites илова кунад.

Favorites Page:

**My Favorites**

Дар он ҳамаи китобҳои дӯстдошта нишон дода шаванд.

Constraint:

`unique(user, book)`

---

## 15. READING SYSTEM

Корбар тугмаи **READ NOW**-ро зер мекунад.

Reader Page кушода шавад.

Имкониятҳо:

- Previous page
- Next page
- Page number
- Progress
- Bookmark
- Font size
- Light/Dark reading mode

Progress нигоҳ дошта шавад.

Агар корбар барояд, дафъаи дигар аз ҳамон ҷой идома диҳад.

---

## 16. READING HISTORY

Саҳифаи **Reading History**:

- китобҳои хондашуда
- китобҳои ҳоло хондашаванда
- progress

нишон дода шаванд.

---

## 17. CATEGORIES

Саҳифаи:

**Explore Categories**

Ҳар category Card дошта бошад.

Мисол:

- Fantasy — 128 books
- Science — 94 books
- History — 72 books
- Programming — 56 books

Вақте category интихоб мешавад, танҳо китобҳои ҳамон category нишон дода шаванд.

---

## 18. MESSAGES / CHAT

Системаи real-time messaging.

User метавонад ба user-и дигар message фиристад.

Имкониятҳо:

- Text message
- Emoji
- Image
- File
- Voice message
- Reply
- Delete message
- Edit message
- Seen status
- Online status
- Typing indicator

Real-time бо:

**WebSocket + Django Channels**

кор кунад.

---

## 19. CHAT PAGE

### Left side

- Chats
- Search users

### Right side

- User profile
- Online status
- Messages
- Input
- Send
- Voice
- Video

---

## 20. AUDIO CALL

Дар Chat button-и **Audio Call** бошад.

Имкониятҳо:

- Microphone permission
- Calling screen
- Accept
- Reject
- End call
- Mute
- Speaker

Барои занг:

- WebRTC
- WebSocket signaling

---

## 21. VIDEO CALL

Button-и **Video Call** бошад.

Имкониятҳо:

- Camera
- Microphone
- Enable/disable camera
- Mute/unmute
- End call

Барои занг:

**WebRTC + WebSocket signaling**

---

## 22. NOTIFICATIONS

Notification system дошта бошад.

Notification барои:

- New message
- Incoming call
- Group invitation
- Group started
- Quiz finished
- New book
- Favorite update
- Password changed
- Email verification

---

## 23. GROUP SYSTEM

Дар sidebar:

**Groups**

Корбар метавонад:

**CREATE GROUP**

ро интихоб кунад.

---

## 24. CREATE GROUP

Fieldҳо:

- Group name
- Description
- Group avatar
- Members

Созандаи group ҳамчун **Admin** таъин шавад.

Admin метавонад:

- user илова кунад
- user хориҷ кунад
- group name иваз кунад
- group delete кунад

---

## 25. GROUP CHAT

Ҳар group chat-и худро дошта бошад.

Дар group:

- Text messages
- Voice messages
- Files
- Images
- Members
- Online members
- Group information

---

## 26. GROUP BOOK GAME

Дар group button:

**START BOOK GAME**

бошад.

Admin ё user-и дорои permission метавонад онро оғоз кунад.

Қадами аввал:

**Choose a book**

Ҳамаи иштирокчиён метавонанд китобро интихоб кунанд.

---

## 27. BOOK GAME

Пас аз интихоби китоб:

**GAME STARTED**

Система барои иштирокчиён **20 савол** созад.

Ҳар савол:

- Question
- A
- B
- C
- D

дошта бошад.

---

## 28. AI QUIZ

Саволҳо метавонанд бо AI сохта шаванд.

AI аз content-и китоб истифода бурда:

- 20 questions
- 4 answer options
- correct answer
- difficulty

эҷод кунад.

Difficulty:

- Easy
- Medium
- Hard

Correct answer танҳо дар backend нигоҳ дошта шавад ва пешакӣ ба frontend фиристода нашавад.

---

## 29. GAME RESULT

Пас аз 20 савол:

- Score
- Correct answers
- Wrong answers
- Time
- Ranking

нишон дода шавад.

Мисол:

```text
GAME FINISHED

Munis
17 / 20

User 2
15 / 20

User 3
12 / 20
```

Leaderboard дошта бошад.

---

## 30. ADMIN / STAFF

Admin метавонад:

- Book create
- Book update
- Book delete
- Category create
- Category update
- Category delete
- User management
- Group management
- Reports

---

## 31. ADD BOOK

Ҳангоми илова кардани китоб:

### Required

- Book cover
- Title
- Author
- Publication year
- Category
- Description

### Optional

- ISBN
- Language
- Pages
- Publisher
- Rating
- Book file
- Audio book
- Author biography

**Book cover ҳатмӣ аст.**

Бе cover китоб сохта нашавад.

---

## 32. BOOK FILE

Барои ҳар китоб метавонад:

- PDF
- EPUB

нигоҳ дошта шавад.

Frontend китобро тавассути secure reader нишон диҳад.

---

## 33. DATABASE MODELS

Моделҳои асосӣ:

```text
User
Profile
Book
Author
Category
BookFile
Favorite
ReadingProgress
ReadingHistory
Bookmark
Chat
ChatMember
Message
Call
Notification
Group
GroupMember
GroupMessage
BookGame
GameParticipant
QuizQuestion
QuizAnswer
```

---

## 34. USER MODEL

```text
User
- id
- username
- email
- password
- first_name
- last_name
- avatar
- bio
- is_verified
- created_at
```

---

## 35. BOOK MODEL

```text
Book
- id
- title
- cover
- author
- description
- publication_year
- category
- language
- pages
- isbn
- publisher
- rating
- created_at
```

---

## 36. READING PROGRESS

```text
ReadingProgress
- user
- book
- current_page
- progress_percent
- last_read_at
```

Барои ҳар `user + book` як progress бошад.

---

## 37. FAVORITE MODEL

```text
Favorite
- user
- book
- created_at
```

Constraint:

```text
unique(user, book)
```

---

## 38. CHAT MODELS

```text
Chat
- id
- type
- created_at
```

Type:

- PRIVATE
- GROUP

Message:

```text
Message
- chat
- sender
- text
- file
- voice
- is_read
- created_at
```

---

## 39. CALL MODEL

```text
Call
- caller
- receiver
- call_type
- status
- started_at
- ended_at
```

Call type:

- AUDIO
- VIDEO

---

## 40. API STRUCTURE

API бояд тақрибан чунин бошад:

```text
/api/auth/register/
/api/auth/verify-email/
/api/auth/login/
/api/auth/refresh/
/api/auth/forgot-password/
/api/auth/verify-reset-code/
/api/auth/reset-password/

/api/users/
/api/users/profile/

/api/books/
/api/books/{id}/
/api/books/{id}/similar/
/api/books/{id}/favorite/

/api/categories/
/api/categories/{id}/books/

/api/reading/
/api/reading/history/
/api/reading/progress/

/api/search/

/api/chats/
/api/chats/{id}/messages/

/api/groups/
/api/groups/{id}/
/api/groups/{id}/members/

/api/games/
/api/games/{id}/start/
/api/games/{id}/questions/
/api/games/{id}/answer/
/api/games/{id}/result/

/api/notifications/
```

---

## 41. WEBSOCKET

WebSocket endpoints:

```text
/ws/chat/{chat_id}/
/ws/group/{group_id}/
/ws/notifications/
/ws/call/{user_id}/
/ws/game/{game_id}/
```

Онлайн status ва typing indicator низ тавассути WebSocket кор кунад.

---

## 42. FRONTEND STRUCTURE

React project:

```text
src/
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── context/
├── utils/
├── assets/
├── styles/
└── App.jsx
```

### Pages

```text
Home
Login
Register
VerifyEmail
ForgotPassword
ResetPassword

Library
BookDetails
Reader
Categories
Favorites
History

Profile
Settings

Messages
Chat

Groups
GroupDetails
GroupGame
Quiz
GameResult

Notifications
Dashboard
```

---

## 43. DESIGN SYSTEM

Дизайн бояд аз screenshot илҳом гирад.

### Main style

- Dark futuristic
- Neon cyan
- Deep navy background
- Glassmorphism
- Glow effects
- Thin borders
- Soft shadows
- Smooth animations

### Colors

```text
Background: #070B2D
Primary: #43E8E8
Secondary: #6C7CFF
Text: #FFFFFF
Muted: #7D8BB5
```

Сайт набояд танҳо як ранг дошта бошад. Барои hierarchy рангҳои secondary ва neutral низ истифода шаванд.

---

## 44. RESPONSIVE DESIGN

Сайт бояд барои:

- Desktop
- Laptop
- Tablet
- Mobile

кор кунад.

Дар mobile sidebar ба hamburger menu табдил ёбад.

Book cards responsive бошанд.

Chat interface барои mobile мутобиқ карда шавад.

---

## 45. SECURITY

Backend бояд:

- JWT authentication
- Password hashing
- Permission classes
- Authentication classes
- CORS configuration
- CSRF protection
- Rate limiting
- Email verification
- Secure file validation
- API permissions

дошта бошад.

Корбар набояд тавонад API-и admin-ро истифода барад.

---

## 46. PERMISSIONS

### Anonymous

Метавонад:

- Home дидан
- Books дидан
- Categories дидан

### User

Метавонад:

- Favorite
- Read
- Chat
- Call
- Group create
- Group join
- Quiz play

### Group Admin

Метавонад:

- Manage members
- Start game
- Manage group

### Super Admin

Метавонад:

- Manage books
- Manage users
- Manage categories
- Manage groups
- Manage platform

---

## 47. EMAIL SYSTEM

Email барои:

### Registration

Verification Code

### Forgot Password

Password Reset Code

### Password Change

Password changed notification

### Notifications

Масалан:

- Group invitation
- Security notification
- Important platform notification

Email template-ҳо professional бошанд.

---

## 48. RECOMMENDATION SYSTEM

Система тадриҷан recommendation созад.

Аз рӯи:

- Favorites
- Reading history
- Categories
- Search history
- Books opened
- Books completed

китобҳои мувофиқ пешниҳод карда шаванд.

Мисол:

**Because you liked Fantasy**

ва:

**Recommended for you**

---

## 49. DASHBOARD

Profile/Dashboard statistics дошта бошад:

- Books Read
- Currently Reading
- Favorites
- Reading Time
- Favorite Category

Chart барои reading activity низ мумкин аст.

---

## 50. ERROR HANDLING

Frontend барои ҳолатҳои зерин UI дошта бошад:

- Loading
- No books found
- No messages
- No notifications
- Invalid password
- Invalid verification code
- Server error
- Network error

Backend status code-ҳои дуруст баргардонад:

```text
200
201
400
401
403
404
409
422
500
```

---

## 51. 404 PAGE

Агар URL вуҷуд надошта бошад:

```text
404

PAGE NOT FOUND

Return Home
```

бо ҳамон futuristic design.

---

## 52. LOADING SYSTEM

Барои API request-ҳо:

- Skeleton loading
- Spinner
- Smooth transitions

истифода шавад.

Сайт ҳангоми loading blank screen нишон надиҳад.

---

# 53. FINAL PAGE MAP

Дар натиҷа сайт чунин саҳифаҳо хоҳад дошт:

1. Home
2. Login
3. Register
4. Verify Email
5. Forgot Password
6. Reset Password
7. Library
8. Book Details
9. Reader
10. Categories
11. Category Books
12. Favorites
13. Reading History
14. Profile
15. Settings
16. Messages
17. Private Chat
18. Audio Call
19. Video Call
20. Notifications
21. Groups
22. Group Details
23. Group Chat
24. Book Game
25. Quiz
26. Game Result
27. Dashboard
28. 404

---

# 54. DEVELOPMENT PHASES

Лоиҳа якбора сохта нашавад. Development ба марҳилаҳо ҷудо карда шавад.

### Phase 1 — Backend Foundation

- Django setup
- DRF
- PostgreSQL
- User
- JWT
- Permissions
- Swagger

### Phase 2 — Authentication

- Register
- Email verification
- Login
- Logout
- Forgot password
- Reset password

### Phase 3 — Books

- Book
- Author
- Category
- CRUD
- Search
- Filter
- Favorites
- Recommendations

### Phase 4 — Reader

- Reader
- Progress
- History
- Bookmark

### Phase 5 — Frontend

- React
- Routing
- Authentication
- Home
- Library
- Book Details
- Reader

### Phase 6 — Chat

- Private chat
- WebSocket
- Online status
- Typing
- Files
- Voice messages

### Phase 7 — Calls

- WebRTC
- Audio call
- Video call
- Signaling
- Call notifications

### Phase 8 — Groups

- Create group
- Members
- Group chat
- Group permissions

### Phase 9 — AI Game

- Book selection
- AI questions
- 20 questions
- 4 options
- Answer validation
- Score
- Leaderboard

### Phase 10 — Production

- Security
- Testing
- Docker
- Nginx
- Gunicorn
- PostgreSQL
- Redis
- HTTPS
- Deployment

---

# 55. ГОЛОВНАЯ ИДЕЯ

Сайт танҳо китобхона набошад.

Он бояд ба як **Social Digital Library** табдил ёбад:

```text
READ
   ↓
DISCOVER
   ↓
FAVORITE
   ↓
CHAT
   ↓
CALL
   ↓
CREATE GROUP
   ↓
CHOOSE BOOK
   ↓
PLAY QUIZ
   ↓
COMPETE
```

Корбар метавонад:

1. Китобро ёбад.
2. Маълумоти китобро бинад.
3. Китобро хонад.
4. Ба Favorites илова кунад.
5. Китобҳои ҳамкатегорияро бинад.
6. Ба дӯстонаш message фиристад.
7. Audio/Video Call кунад.
8. Group созад.
9. Бо гурӯҳ китоб интихоб кунад.
10. Аз рӯи китоб 20 саволи AI Quiz гузарад.
11. Натиҷаро бо дигар иштирокчиён муқоиса кунад.

Ҳамин тавр Digital Library аз як китобхонаи одӣ ба **Social Reading Platform** табдил меёбад.
