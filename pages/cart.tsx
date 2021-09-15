import React, { useContext } from "react";
import Layout from "../components/Layout";
import { actionTypes, StoreContext } from "../utils/Store";
import NextLink from "next/link";
import dynamic, { LoaderComponent } from "next/dynamic";
import Image from "next/image";
import {
  Grid,
  TableContainer,
  Table,
  Typography,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Select,
  MenuItem,
  Button,
  Card,
  List,
  ListItem,
} from "@material-ui/core";
import axios from "axios";
import { IProduct } from "../models/Product";
import { useRouter } from "next/router";

const CartScreen: React.ReactNode = () => {
  const router = useRouter()
  const { state, dispatch } = useContext(StoreContext);
  const {
    cart: { cartItems },
  } = state;

  const updateCartHandler = async (item: IProduct, quantity: number) => {
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    dispatch({ type: actionTypes.CART_ADD_ITEM, payload: { ...item, quantity } });
  };
  
  const removeItemHandler = (item: IProduct) => {
    dispatch({ type: actionTypes.CART_REMOVE_ITEM, payload: item });
  };

  const checkoutHandler = () => {
    router.push('/shipping');
  };

  return (
    <Layout title="Shopping Cart">
      <Typography component="h1" variant="h1">
        Shopping Cart
      </Typography>
      {cartItems.length === 0 ? (
        <div>
          Cart is empty.{' '}
          <NextLink href="/" passHref>
            <Link>Go shopping</Link>
          </NextLink>
        </div>
      ) : (
        <Grid container spacing={1}>
          <Grid item md={9} xs={12}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <NextLink href={`/product/${item.slug}`} passHref>
                          <Link>
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={50}
                              height={50}
                            ></Image>
                          </Link>
                        </NextLink>
                      </TableCell>

                      <TableCell>
                        <NextLink href={`/product/${item.slug}`} passHref>
                          <Link>
                            <Typography>{item.name}</Typography>
                          </Link>
                        </NextLink>
                      </TableCell>
                      <TableCell align="right">
                        <Select value={item.quantity} onChange={(e) =>
                            updateCartHandler(item, e.target.value as number)
                          }>
                          {[...Array(item.countInStock).keys()].map((x) => (
                            <MenuItem key={x + 1} value={x + 1}>
                              {x + 1}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="right">${item.price}</TableCell>
                      <TableCell align="right">
                        <Button variant="contained" color="secondary" onClick={() => removeItemHandler(item)}>
                          x
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item md={3} xs={12}>
            <Card>
              <List>
                <ListItem>
                  <Typography variant="h2">
                    Subtotal (
                    {(cartItems as Array<IProduct>).reduce(
                      (a, c) => a + c.quantity,
                      0
                    )}{" "}
                    items) : $
                    {(cartItems as Array<IProduct>).reduce(
                      (a, c) => a + c.quantity * c.price,
                      0
                    )}
                  </Typography>
                </ListItem>
                <ListItem>
                  <Button variant="contained" color="primary" fullWidth onClick={checkoutHandler}>
                    Check Out
                  </Button>
                </ListItem>
              </List>
            </Card>
          </Grid>
        </Grid>
      )}
    </Layout>
  );
};

export default dynamic<any>(() => Promise.resolve(CartScreen) as LoaderComponent<any>, { ssr: false });
