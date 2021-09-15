import { NextApiRequest, NextApiResponse } from "next";
import nc from 'next-connect';
import { isAuth } from '../../../utils/auth';

const handler = nc<NextApiRequest, NextApiResponse>();
handler.use(isAuth);
handler.get(async (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});

export default handler;