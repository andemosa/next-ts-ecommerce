import React, { useContext } from "react";
import { InferGetServerSidePropsType } from "next";
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Button,
} from "@material-ui/core";
import NextLink from "next/link";
import Layout from "../components/Layout";
import Product, { IProduct } from "../models/Product";
import db from "../utils/db";
import axios from 'axios';
import { useRouter } from 'next/router';
import { actionTypes, StoreContext } from '../utils/Store';


const Home: React.ReactNode = ({
  products,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { state, dispatch } = useContext(StoreContext);
  
  const addToCartHandler = async (product: IProduct) => {
    const existItem = state.cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    dispatch({ type: actionTypes.CART_ADD_ITEM, payload: { ...product, quantity } });
    router.push('/cart');
  };

  return (
    <Layout>
      <div>
        <h1>Products</h1>
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item md={4} key={product.name}>
              <NextLink href={`/product/${product.slug}`} passHref>
                <Card>
                  <CardActionArea>
                    <CardMedia
                      component="img"
                      image={product.image}
                      title={product.name}
                    ></CardMedia>
                    <CardContent>
                      <Typography>{product.name}</Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions>
                    <Typography>${product.price}</Typography>
                    <Button size="small"
                    color="primary"
                    onClick={() => addToCartHandler(product as IProduct)}>
                      Add to cart
                    </Button>
                  </CardActions>
                </Card>
              </NextLink>
            </Grid>
          ))}
        </Grid>
      </div>
    </Layout>
  );
};

export default Home;

export const getServerSideProps = async () => {
  await db.connect();
  const products = await Product.find({}).lean();
  await db.disconnect();
  return {
    props: {
      products: products.map(db.convertDocToObj),
    },
  };
};
