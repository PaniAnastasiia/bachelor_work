import { NextAuthOptions } from 'next-auth'
import { getServerSession } from "next-auth/next"
import Order from '../../../models/Order';
import User from '../../../models/User';
import db from '../../../utils/db';

const handler = async (req, res) => {
  const session = await getServerSession( req, res, NextAuthOptions );
  if (!session) {
    return res.status(401).send('signin required');
  }
  const { user } = session;
  await db.connect();
  const users = await User.find().lean();
  const mongoUser = users.find(obj => {
    return obj.email == user.email
  })
  const orders = await Order.find({ user: mongoUser._id });
  res.send(orders);
};

export default handler;
