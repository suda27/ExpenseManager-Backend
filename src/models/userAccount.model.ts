import Currency from "./currency.model";

interface UserAccount {
  userID: string;
  accountID: string;
  account_name: string;
  account_group: string;
  account_amount: string;
  account_description: string;
  account_status: string;
  account_created_date: string;
  account_updated_date: string;
}

export default UserAccount;
