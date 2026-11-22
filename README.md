# 🚀 Social Scheduler

**An AI-powered social media management and scheduling platform.**

Social Scheduler is a full-stack web application that helps users create, manage, and schedule social media posts from one place. It uses AI to generate engaging post content and images, supports multiple social media platforms, and automates post publishing.

## ✨ Features

- 🔐 **User Authentication** – Secure registration and login using JWT and bcrypt.
- 🤖 **AI Content Generation** – Generate engaging social media captions using Google Gemini.
- 🎨 **AI Image Generation** – Generate images using Hugging Face FLUX.1-schnell.
- 📱 **Social Media Integration** – Connect supported social media accounts through Zernio.
- 📅 **Post Scheduling** – Schedule posts for a specific date and time.
- 🖼️ **Media Upload** – Upload images and videos using Cloudinary.
- ⚡ **Automatic Publishing** – Automatically process scheduled posts using Node Cron.
- 📊 **Dashboard** – Monitor scheduled posts, published posts, connected accounts, and recent activity.
- 📝 **Generation History** – Access previously generated AI content.

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose

### AI & Integrations
- Google Gemini API
- Hugging Face Inference API
- Cloudinary
- Zernio API

### Authentication & Scheduling
- JSON Web Token (JWT)
- Bcrypt
- Node Cron
- Multer

## 📂 Project Structure

```text
social-scheduler/
│
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── Accounts.tsx
│       │   ├── AIComposer.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   └── Scheduler.tsx
│       ├── App.tsx
│       └── main.tsx
│
└── server/
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── models/
    ├── routes/
    ├── services/
    │   └── schedulerService.ts
    ├── server.ts
    └── package.json
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd social-scheduler
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=3000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Authentication
JWT_SECRET=your_jwt_secret

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Hugging Face
HF_TOKEN=your_huggingface_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Zernio
ZERNIO_API_KEY=your_zernio_api_key
```

**Important:** Never upload your actual API keys or `.env` file to GitHub.

### 4. Start the Backend

```bash
npm run server
```

Backend runs at:

```text
http://localhost:3000
```

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

### 6. Configure Frontend

Optionally create a `.env` file inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 7. Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔄 How It Works

### 1. User Authentication
Users register and log in securely. Passwords are hashed using bcrypt, and JWT tokens are used to authenticate protected API requests.

### 2. Connect Social Accounts
Users initiate social account authorization through Zernio. Connected accounts are synchronized and stored in MongoDB.

### 3. AI Content Generation
Users enter a prompt and select a tone. Google Gemini generates social media content and an image prompt. Hugging Face can optionally generate an image.

### 4. Schedule Posts
Users create posts, select social media platforms, upload media, and choose a publishing date and time.

### 5. Automatic Publishing
A Node Cron job checks scheduled posts every minute. Due posts are submitted to Zernio using the connected social accounts.

### 6. Dashboard
Users can view their scheduled posts, published posts, connected accounts, and recent activity.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/oauth/:platform/url` | Generate authorization URL |
| GET | `/api/oauth/sync` | Synchronize social accounts |
| GET | `/api/accounts` | Get connected accounts |
| POST | `/api/accounts` | Add account |
| GET | `/api/posts` | Get posts |
| POST | `/api/posts` | Schedule a post |
| POST | `/api/posts/generate` | Generate AI content |
| GET | `/api/posts/generations` | Get AI generation history |
| GET | `/api/activity` | Get recent activity |

All endpoints except registration and login require JWT authentication.

## 🗄️ Database Models

The application uses MongoDB with Mongoose.

| Model | Description |
|---|---|
| User | Stores user information and authentication details |
| Account | Stores connected social media accounts |
| Post | Stores post content, media, platforms, schedule and status |
| Generation | Stores AI-generated content and prompts |
| ActivityLog | Stores user activity and publishing history |

## 🚀 Future Enhancements

- Advanced social media analytics.
- Post editing and rescheduling.
- Calendar-based scheduling interface.
- Improved publishing retry mechanism.
- Detailed engagement reports.
- Automated testing and performance optimization.
- Support for additional social media platforms.

## 🔒 Security

- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API routes.
- Environment variables for sensitive credentials.
- User-specific database queries.

## 👨‍💻 Author

**Anurag Yadav**

- GitHub: [Your GitHub Profile](https://github.com/6387anu)
- Project: Social Scheduler

## 📄 License

No license has been specified for this project yet.

---

<p align="center">
  ⭐ If you find this project interesting, consider giving it a star!
</p>

<p align="center">
  Built with ❤️ using React, Node.js, MongoDB and AI.
</p>
