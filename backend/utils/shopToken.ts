import { Request, Response, CookieOptions } from 'express';

interface User {
  getJwtToken: () => string;
  // add any other properties the User has that you need to use
}

const sendShopToken = (user: User, statusCode: number, res: Response): void => {
  const token: string = user.getJwtToken();

  // Options for cookies
  const options: CookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res
    .status(statusCode)
    .cookie('seller_token', token, options)
    .json({
      success: true,
      user,
      token,
    });
};

export default sendShopToken;

