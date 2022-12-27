class UserCategory {

    categoryId: string;
    categoryName: string;
    subCategory: UserCategory[];

    constructor(data: any) {
        this.categoryId = data.categoryId;
        this.categoryName = data.categoryName;
        this.subCategory = data.subCategory;

    }
}
export default UserCategory;

