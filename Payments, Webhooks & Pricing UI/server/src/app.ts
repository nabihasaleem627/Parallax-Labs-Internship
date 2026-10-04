import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import webhookRoutes from './routes/webhooks.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import customerRoutes from './routes/customers.js';
import billingRoutes from './routes/billing.js';
import { errorHandler } from './utils/http.js';
import './types.js';

export const app=express();
app.use(helmet());
app.use(cors({origin:env.FRONTEND_URL,credentials:true}));
app.use(morgan(env.NODE_ENV==='production'?'combined':'dev'));
// The Stripe route must be mounted before express.json() so signature verification receives the untouched body.
app.use('/api/webhooks',webhookRoutes);
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({success:true,data:{status:'ok',service:'bookflow-api'}}));
app.use('/api/auth',authRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/customers',customerRoutes);
app.use('/api/billing',billingRoutes);
app.use('/api',(_req,res)=>res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'API endpoint not found.'}}));
app.use(errorHandler);
