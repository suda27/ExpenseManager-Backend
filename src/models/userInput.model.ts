import Currency from "./currency.model";

interface User {
  userID: string;
  name: string;
  currency: Currency;
  email: string;
  profile_pic: string;
  status: string;
  created_date: string;
}

export default User;
