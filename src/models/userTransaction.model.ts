import Currency from "./currency.model";
import UserCategory from "./userCategory.model";

class UserTransaction {
  userId: string;
  source_account_id: string;
  source_account_name: string;
  destination_account_id: string;
  destination_account_name: string;
  transactionID: string;
  transaction_type: string;
  transaction_amount: string;
  transaction_date: string;
  transaction_status: string;
  category: UserCategory;
  note: string;
  description: string;
  currency: Currency;
  created_date: string;
  updated_date: string;

  constructor(data: any) {
    this.userId = data.userId;
    this.source_account_id = data.source_account_id;
    this.source_account_name = data.source_account_name;
    this.destination_account_id = data.destination_account_id;
    this.destination_account_name = data.destination_account_name;
    this.transactionID = data.transactionID;
    this.transaction_type = data.transaction_type;
    this.transaction_amount = data.transaction_amount;
    this.transaction_date = data.transaction_date;
    this.transaction_status = data.transaction_status;
    this.category = data.category;
    this.note = data.note;
    this.description = data.description;
    this.currency = data.currency;
    this.created_date = data.created_date;
    this.updated_date = data.updated_date;
  }

  public static fromItem(item) {
    const data = {
      userId: item.userId,
      source_account_id: item.source_account_id,
      source_account_name: item.source_account_name,
      destination_account_id: item.destination_account_id,
      destination_account_name: item.destination_account_name,
      transactionID: item.transactionID,
      transaction_type: item.transaction_type,
      transaction_amount: item.transaction_amount,
      transaction_date: item.transaction_date,
      transaction_status: item.transaction_status,
      category: item.category,
      note: item.note,
      description: item.description,
      currency: item.currency,
      created_date: item.created_date,
      updated_date: item.updated_date
    };
    const userTransaction = new UserTransaction(data);
    return userTransaction;
  }
}

export default UserTransaction;
