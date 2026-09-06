import axios from "axios";

export const searchProductsApi = async (search: string) => {
  const response = await axios.get(
    `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}`
  );

  return response.data;
};