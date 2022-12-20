import Currency from "./currency.model";

class User {
  userId: string;
  name: string;
  currency: Currency;
  email: string;
  picture: string;
  status: string;
  created_date: string;
  updated_date: string;
  exp: number;

  constructor(data: any) {
    this.userId = data.userId;
    this.name = data.name;
    this.currency = data.currency;
    this.email = data.email;
    this.picture = data.picture;
    this.status = data.status;
    this.created_date = data.created_date;
    this.updated_date = data.updated_date;
    this.exp = data.exp;
  }

  public static fromItem(item) {
    const data = {
      userId: item.userId,
      name: item.name,
      currency: item.currency,
      email: item.email,
      picture: item.picture,
      status: item.status,
      created_date: item.created_date,
      updated_date: item.updated_date,
      exp: item.exp
    };
    const user = new User(data);
    return user;
  }
}

export default User;
