import UserCategory from "../models/userCategory.model";
import { v4 as uuidv4 } from "uuid";

export const loadDefaultExpenseCategoryForUser = () => {

    const data: UserCategory[] = [{

        categoryId: uuidv4(),
        categoryName: "Food",
        subCategory: [
            {
                categoryId: uuidv4(),
                categoryName: "Eating Out",
                subCategory: []
            },
            {
                categoryId: uuidv4(),
                categoryName: "Lunch",
                subCategory: []
            },
            {
                categoryId: uuidv4(),
                categoryName: "Dinner",
                subCategory: []
            },
            {
                categoryId: uuidv4(),
                categoryName: "Zomato",
                subCategory: []
            }
        ],

    },
    {
        categoryId: uuidv4(),
        categoryName: "Social Life",
        subCategory: [{
            categoryId: uuidv4(),
            categoryName: "Meet Up",
            subCategory: []
        },
        {
            categoryId: uuidv4(),
            categoryName: "Party",
            subCategory: []
        }]
    },
    {
        categoryId: uuidv4(),
        categoryName: "Snooker",
        subCategory: []
    }
    ]

    return data;
}

export const loadDefaultIncomeCategoryForUser = () => {

    const data: UserCategory[] = [{

        categoryId: uuidv4(),
        categoryName: "Salary",
        subCategory: [],

    },
    {
        categoryId: uuidv4(),
        categoryName: "Owes",
        subCategory: []
    },
    {
        categoryId: uuidv4(),
        categoryName: "Other",
        subCategory: []
    },
    {
        categoryId: uuidv4(),
        categoryName: "Allowance",
        subCategory: []
    },
    {
        categoryId: uuidv4(),
        categoryName: "Refund",
        subCategory: []
    },
    {
        categoryId: uuidv4(),
        categoryName: "Credit Interest",
        subCategory: []
    }
    ]

    return data;
}