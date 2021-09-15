// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
//import db from '../../utils/db';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  //await db.connect();
  //await db.disconnect();
  res.status(200).json({ name: 'John Doe' })
}