// pages/api/cron.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the Authorization header matches the CRON_SECRET
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Your cron job logic goes here (e.g., send emails, process data, etc.)
  res.status(200).json({ message: 'Hello Cron!' });
}
