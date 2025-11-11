import { client } from "../config/db.js"

export const createUser = async (username, email, password) => {
  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at;
  `;
  const values = [username, email, password];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const getUser=async(email)=>{
    const query=`
    SELECT * FROM users
    WHERE email=$1
    `
    const values=[email]
    const result=await client.query(query,values)
    return result.rows[0];
}
