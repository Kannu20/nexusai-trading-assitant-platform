// ================================================================
// lib/models/User.ts — MongoDB User model
// ================================================================

import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ── TypeScript interface ─────────────────────────────────────────
export interface IUser extends Document {
  uid:          string;       // Firebase UID (primary link)
  email:        string;
  name:         string;
  photoURL?:    string;
  provider:     'google' | 'email' | 'mixed';
  role:         'user' | 'admin';
  plan:         'free' | 'pro' | 'enterprise';
  isVerified:   boolean;
  lastLoginAt:  Date;
  createdAt:    Date;
  updatedAt:    Date;
  // Extended profile
  preferences: {
    currency:   string;
    theme:      'dark' | 'light';
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    language: string; timezone: string; dateFormat: string;
    numberFormat: string; defaultTimeframe: string; compactNumbers: boolean;
  };
   apiKeys: { finnhub?: string; openrouter?: string; openrouterModel?: string; };
  notifications: {
    emailEnabled: boolean; pushEnabled: boolean; priceAlerts: boolean;
    riskAlerts: boolean; newsAlerts: boolean; weeklyDigest: boolean;
    priceThreshold: number;
  };
  dashboard: {
    showTicker: boolean; showMiniCharts: boolean; autoRefresh: boolean;
    refreshInterval: number; defaultTab: string; pinnedAssets: string[];
  };
  privacy: { analyticsEnabled: boolean; crashReporting: boolean; showOnLeaderboard: boolean; };
}

// ── Schema ───────────────────────────────────────────────────────
// const UserSchema = new Schema<IUser>(
//   {
//     uid: {
//       type:     String,
//       required: [true, 'Firebase UID is required'],
//       unique:   true,
//       index:    true,
//     },
//     email: {
//       type:      String,
//       required:  [true, 'Email is required'],
//       unique:    true,
//       lowercase: true,
//       trim:      true,
//       match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
//     },
//     name: {
//       type:     String,
//       required: [true, 'Name is required'],
//       trim:     true,
//       minlength: [2, 'Name must be at least 2 characters'],
//       maxlength: [60, 'Name cannot exceed 60 characters'],
//     },
//     photoURL: {
//       type:    String,
//       default: null,
//     },
//     provider: {
//       type:    String,
//       // enum:    ['google', 'email', 'mixed'],
//       // default: 'email',
//     },
//     role: {
//       type:    String,
//       enum:    ['user', 'admin'],
//       default: 'user',
//     },
//     plan: {
//       type:    String,
//       enum:    ['free', 'pro', 'enterprise'],
//       default: 'free',
//     },
//     isVerified: {
//       type:    Boolean,
//       default: false,
//     },
//     lastLoginAt: {
//       type:    Date,
//       default: Date.now,
//     },
//     preferences: {
//       currency: {
//         type:    String,
//         default: 'USD',
//       },
//       theme: {
//         type:    String,
//         enum:    ['dark', 'light'],
//         default: 'dark',
//       },
//       riskProfile: {
//         type:    String,
//         enum:    ['conservative', 'moderate', 'aggressive'],
//         default: 'moderate',
//       },
//     },
    
//   },
  

//   {
//     timestamps: true,    // Auto-manage createdAt + updatedAt
//     versionKey: false,   // Remove __v field
//   }
// );
 
const UserSchema = new Schema<IUser>(
  {
    uid:      { type: String, required: true, unique: true, index: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:     { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    photoURL: { type: String, default: null },
    provider: { type: String, enum: ['google','email','mixed','google.com'], default: 'email' },
    role:     { type: String, enum: ['user','admin'], default: 'user' },
    plan:     { type: String, enum: ['free','pro','enterprise'], default: 'free' },
    isVerified:  { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: Date.now },
    preferences: {
      currency:         { type: String, default: 'USD' },
      theme:            { type: String, enum: ['dark','light'], default: 'dark' },
      riskProfile:      { type: String, enum: ['conservative','moderate','aggressive'], default: 'moderate' },
      language:         { type: String, default: 'en' },
      timezone:         { type: String, default: 'UTC' },
      dateFormat:       { type: String, default: 'MM/DD/YYYY' },
      numberFormat:     { type: String, default: 'en-US' },
      defaultTimeframe: { type: String, default: '1M' },
      compactNumbers:   { type: Boolean, default: false },
    },
    apiKeys: {
      finnhub:         { type: String, default: '' },
      openrouter:      { type: String, default: '' },
      openrouterModel: { type: String, default: 'meta-llama/llama-3.1-8b-instruct:free' },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      pushEnabled:  { type: Boolean, default: true },
      priceAlerts:  { type: Boolean, default: true },
      riskAlerts:   { type: Boolean, default: true },
      newsAlerts:   { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: false },
      priceThreshold: { type: Number, default: 2 },
    },
    dashboard: {
      showTicker:      { type: Boolean, default: true },
      showMiniCharts:  { type: Boolean, default: true },
      autoRefresh:     { type: Boolean, default: true },
      refreshInterval: { type: Number, default: 30 },
      defaultTab:      { type: String, default: 'overview' },
      pinnedAssets:    { type: [String], default: ['gold','aapl','nvda'] },
    },
    privacy: {
      analyticsEnabled:  { type: Boolean, default: true },
      crashReporting:    { type: Boolean, default: true },
      showOnLeaderboard: { type: Boolean, default: false },
    },
  },
  { timestamps: true, versionKey: false }
);


// ── Indexes ──────────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ uid: 1 });

// ── Transform output — remove sensitive fields from toJSON ───────
UserSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r._id;
    return ret;
  },
});

// ── Static helper: upsert user from Firebase decoded token ───────
UserSchema.statics.upsertFromFirebase = async function (
  decoded: { uid: string; email: string; name?: string; picture?: string; firebase?: { sign_in_provider?: string } }
) {
  const provider =
    decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email';

  return this.findOneAndUpdate(
    { uid: decoded.uid },
    {
      $set: {
        uid:         decoded.uid,
        email:       decoded.email ?? '',
        name:        decoded.name ?? decoded.email?.split('@')[0] ?? 'User',
        photoURL:    decoded.picture ?? null,
        provider,
        isVerified:  true,
        lastLoginAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};

// ── Prevent model recompilation during hot reloads ───────────────
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;