/* eslint-disable no-unused-vars */
import { NextApiRequest, NextApiResponse } from "next";import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

const secret = process.env.JWT_SECRET as string

const signToken = (user: IUser) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    secret,
    {
      expiresIn: "30d",
    }
  );
};

const isAuth = async (req: any, res: NextApiResponse, next: any) => {
  const { authorization } = req.headers;
  if (authorization) {
    // Bearer xxx => xxx
    const token = authorization.slice(7, authorization.length);
    jwt.verify(token, secret, (err: any, decode: any) => {
      if (err) {
        res.status(401).send({ message: 'Token is not valid' });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'Token is not suppiled' });
  }
};

export { signToken, isAuth };
