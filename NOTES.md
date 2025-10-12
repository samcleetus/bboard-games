# Boardle Game - Development Notes

## Project Overview
- **Game Name**: Boardle (Board game word guessing game)
- **Tech Stack**: React + Vite, Supabase (database & auth), Vercel (hosting)
- **Live URL**: https://carlson-games.vercel.app
- **Repository**: https://github.com/samcleetus/bboard_games

## Deployment Status ✅
- **Status**: LIVE and fully functional
- **Hosting**: Vercel (free tier)
- **Database**: Supabase (free tier)
- **Auto-deployments**: Enabled (push to GitHub = auto-deploy)

---

## Important Configuration Files

### Environment Variables (.env)
```bash
VITE_SUPABASE_URL=https://dqaubsbykpbxepwfuowp.supabase.co
VITE_SUPABASE_ANON_KEY=[your_key_here]
```
**Note**: These are also configured in Vercel dashboard for production.

### Vercel Configuration (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
**Purpose**: Fixes SPA routing issues (404s on refresh).

### Docker Configuration (Dockerfile)
- **Image Name**: `carlson-games`
- **Purpose**: Local production testing
- **Command to run**: `docker run -p 3000:3000 carlson-games`

---

## Deployment Journey & Solutions

### 1. Initial Development
- Built React app with Vite
- Integrated Supabase for database and authentication
- Tested locally with `npm run dev`

### 2. Docker Setup (Production Testing)
**Problem**: Needed to verify app works in production-like environment
**Solution**: 
- Created Dockerfile with Node.js 20
- Fixed environment variable issues
- Successfully containerized the app

### 3. Vercel Deployment
**Problem**: Needed free hosting with database support
**Solution**: 
- Deployed to Vercel (perfect for React + Supabase)
- Configured environment variables in Vercel dashboard
- Set up auto-deployments from GitHub

### 4. SPA Routing Fix
**Problem**: 404 errors when refreshing pages like `/dashboard`
**Solution**: Added `vercel.json` with rewrites configuration

---

## How to Update the Website

### Simple Process:
1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. Vercel automatically deploys (1-3 minutes)

### No manual deployment needed! 🚀

---

## Important Commands

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Docker (for production testing)
```bash
docker build -t carlson-games .           # Build container
docker run -p 3000:3000 carlson-games     # Run container
docker images                             # List images
```

### Git Workflow
```bash
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push origin main # Deploy to production (via Vercel)
```

---

## Database Schema (Supabase)

### Tables Created:
1. **user_profiles** - User account information
2. **boardle_games** - Game results and scores
3. **leaderboard data** - Computed from games table

### Authentication:
- Supabase Auth handles signup/login
- User sessions persist across browser refreshes

---

## Known Issues & Solutions

### Issue: Deleted user still authenticated
**Problem**: Deleting user from Supabase dashboard only removes profile data, not auth data
**Solution**: Need to delete from both Auth and custom tables
**Status**: Noted for future improvement

### Issue: Daily game reset
**Status**: Monitoring - should reset at midnight UTC

---

## Performance & Scaling

### Current Limits (Free Tiers):
- **Vercel**: 100GB bandwidth/month
- **Supabase**: 500MB database, 2GB bandwidth/month

### When to Upgrade:
- If bandwidth exceeds limits
- If database grows beyond 500MB
- If need custom domains or advanced features

---

## Future Improvements

### High Priority:
- [ ] Fix user deletion process (auth + profile sync)
- [ ] Add user account deletion feature
- [ ] Monitor daily game reset functionality

### Nice to Have:
- [ ] Custom domain name
- [ ] Game statistics and analytics
- [ ] Social sharing features
- [ ] Mobile app version

---

## Emergency Procedures

### If Site Goes Down:
1. Check Vercel dashboard for deployment status
2. Check Supabase dashboard for database status
3. Review recent GitHub commits for problematic changes
4. Use Vercel's rollback feature if needed

### If Database Issues:
1. Check Supabase dashboard
2. Verify environment variables in Vercel
3. Check browser console for connection errors

### If Deployment Fails:
1. Check Vercel deployment logs
2. Verify build passes locally: `npm run build`
3. Check for syntax errors or missing dependencies

---

## Key Learnings

1. **Docker is excellent for testing production environments locally**
2. **Vercel + Supabase is a powerful free stack for React apps**
3. **SPA routing needs special configuration on hosting platforms**
4. **Environment variables must be configured both locally and in production**
5. **Auto-deployments make updates incredibly easy**

---

## Contact & Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard  
- **GitHub Repository**: https://github.com/samcleetus/bboard_games
- **Live Website**: https://carlson-games.vercel.app

---

*Last Updated: [Current Date]*
*Status: Production Ready ✅*