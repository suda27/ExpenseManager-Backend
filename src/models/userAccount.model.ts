import Currency from "./currency.model";

class UserAccount {
  public userId: string;
  public accountID: string;
  public account_name: string;
  public account_group: string;
  public account_amount: string;
  public account_description: string;
  public account_status: string;
  public account_created_date: string;
  public account_updated_date: string;

  constructor(data: any) {
    this.userId = data.userId;
    this.accountID = data.accountID;
    this.account_name = data.account_name;
    this.account_group = data.account_group;
    this.account_amount = data.account_amount;
    this.account_description = data.account_description;
    this.account_status = data.account_status;
    this.account_created_date = data.account_created_date;
    this.account_updated_date = data.account_updated_date;
  }
  public static fromItem(item) {
    const data = {
      userId: item.userId,
      accountID: item.accountID,
      account_name: item.account_name,
      account_group: item.account_group,
      account_amount: item.account_amount,
      account_description: item.account_description,
      account_status: item.account_status,
      account_created_date: item.account_created_date,
      account_updated_date: item.account_updated_date
    };
    const userAccount = new UserAccount(data);
    return userAccount;
  }
}

export default UserAccount;
