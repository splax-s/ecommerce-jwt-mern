import { Response } from 'express';

interface User {
  getJwtToken: () => string;
  // define other properties if necessary
}

const sendToken = (user: any, statusCode: number, res: Response): Response => {
  const token = user.getJwtToken();

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
  };

  return res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

export default sendToken;
