import axios from 'axios';

export async function fetchUserInfo(userId: string) {
  const res = await axios.get(`http://localhost:8000/api/user/${userId}`);
  return res.data;
}
