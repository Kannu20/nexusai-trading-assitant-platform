// ================================================================
// lib/models/Activity.ts — MongoDB activity log model
// ================================================================

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IActivity extends Document {
  uid:       string;
  action:    string;
  category:  'auth' | 'portfolio' | 'ai' | 'alert' | 'simulator' | 'account' | 'market';
  icon:      string;
  device?:   string;
  ip?:       string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    uid:      { type: String, required: true, index: true },
    action:   { type: String, required: true },
    category: { type: String, enum: ['auth','portfolio','ai','alert','simulator','account','market'], default: 'account' },
    icon:     { type: String, default: '📝' },
    device:   { type: String },
    ip:       { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ActivitySchema.index({ uid: 1, createdAt: -1 });

const Activity: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity>) ||
  mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;