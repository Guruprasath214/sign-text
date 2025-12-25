# Deaf & Dump Communication Platform

A real-time video calling platform that bridges communication between deaf/mute individuals and hearing individuals using AI-powered sign language detection and speech-to-text technology.

## Features

- 🎥 **WebRTC Video Calling** - Peer-to-peer video calls with room-based system
- 👋 **Sign Language Detection** - AI model detects ASL signs (HELLO, NO, THANK_YOU, YES)
- 🎤 **Speech-to-Text** - Real-time voice transcription using Web Speech API
- 💬 **Live Captions** - Color-coded captions for both sign language and speech
- 🔐 **Secure Authentication** - JWT-based auth with HTTPOnly cookies
- 📊 **Call History** - Track past video calls
- 👥 **Online Users** - See who's available for calls
- 🔒 **Production Security** - Rate limiting, password hashing, HTTPS support

## Tech Stack

### Frontend
- React 18 + Vite
- React Router DOM v6
- Socket.IO Client
- Simple-Peer (WebRTC)
- Zustand (State Management)
- React Toastify
- Tailwind CSS

### Backend
- Flask + Flask-SocketIO
- MongoDB Atlas
- MediaPipe (Hand Tracking)
- Scikit-learn (Sign Recognition)
- bcrypt (Password Hashing)
- JWT Authentication
- Flask-Limiter (Rate Limiting)

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account
- Webcam & Microphone (for testing)

### Backend Setup
```bash
cd back-end
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB URI
python api_server.py
```

### Frontend Setup
```bash
cd front-end
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

## Deployment

### Using Render.com (Free)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/deaf-dump.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy both services
   - Wait 5-10 minutes for deployment

3. **Update Environment Variables**
   - Backend: Update `ALLOWED_ORIGINS` with your frontend URL
   - Frontend: Automatically configured via `render.yaml`

4. **Access Your App**
   - Frontend: `https://deaf-dump-frontend.onrender.com`
   - Backend: `https://deaf-dump-backend.onrender.com`

## Environment Variables

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `SECRET_KEY` - JWT secret key (auto-generated on Render)
- `ALLOWED_ORIGINS` - Comma-separated frontend URLs
- `FORCE_HTTPS` - Set to `True` in production
- `PORT` - Server port (default: 5000)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Backend WebSocket URL

## Supported Sign Language

Currently supports 4 ASL signs:
- HELLO
- NO
- THANK_YOU
- YES

To add more signs, collect training data using `back-end/sign_recognition/collect_data.py` and retrain the model.

## Browser Compatibility

- **WebRTC**: Chrome, Edge, Firefox, Safari
- **Speech Recognition**: Chrome, Edge (not Firefox/Safari)
- **Sign Detection**: All modern browsers

## Known Limitations

- Free Render tier has cold starts (may take 30s to wake up)
- Speech recognition only works in Chrome/Edge
- STUN servers may not work behind strict NAT (consider adding TURN server)
- Sign detection requires good lighting and clear hand visibility

## Future Enhancements

- [ ] Add more sign language support (ISL, BSL)
- [ ] Implement TURN server for better WebRTC reliability
- [ ] Add conversation transcript download
- [ ] Multi-language speech recognition
- [ ] Mobile app (React Native)
- [ ] Group video calls

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Support

For issues or questions, please open a GitHub issue.
