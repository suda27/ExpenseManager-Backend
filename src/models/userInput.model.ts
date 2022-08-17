import Currency from "./currency.model";

class User {
  userID: string;
  name: string;
  currency: Currency;
  email: string;
  profile_pic: string;
  status: string;
  created_date: string;
  updated_date: string;

  constructor(data: any) {
    this.userID = data.userID;
    this.name = data.name;
    this.currency = data.currency;
    this.email = data.email;
    this.profile_pic = data.profile_pic;
    this.status = data.status;
    this.created_date = data.created_date;
    this.updated_date = data.updated_date;
  }

  public static fromItem(item) {
    const data = {
      userID: item.userID,
      name: item.name,
      currency: item.currency,
      email: item.email,
      profile_pic: item.profile_pic,
      status: item.status,
      created_date: item.created_date,
      updated_date: item.updated_date
    };
    const user = new User(data);
    return user;
  }
}

export default User;
