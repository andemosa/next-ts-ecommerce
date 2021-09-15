/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useReducer } from "react";
import dynamic, { LoaderComponent } from "next/dynamic";
import Layout from "../../components/Layout";
import { StoreContext } from "../../utils/Store";
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
  CircularProgress,
  Card,
  List,
  ListItem,
} from "@material-ui/core";
import axios from "axios";
import { useRouter } from "next/router";
import useStyles from "../../utils/styles";
import { getError } from "../../utils/error";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { IOrder, IOrderItems } from "../../models/Order";
import {  DISPATCH_ACTION, PayPalButtons, SCRIPT_LOADING_STATE, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useSnackbar } from "notistack";

enum actionTypes {
  FETCH_REQUEST = "FETCH_REQUEST",
  FETCH_SUCCESS = "FETCH_SUCCESS",
  FETCH_FAIL = "FETCH_FAIL",
  PAY_REQUEST = "PAY_REQUEST",
  PAY_SUCCESS = "PAY_SUCCESS",
  PAY_FAIL = "PAY_FAIL",
  PAY_RESET = "PAY_RESET"
}

interface IState {
  loading: boolean;
  error: any;
  order: IOrder | null;
  loadingPay?: boolean;
  successPay?: boolean;
  errorPay?: any;
}

interface IAction {
  type: keyof typeof actionTypes;
  payload?: IOrder | any;
}

function reducer(state: IState, action: IAction): IState {
  switch (action.type) {
    case actionTypes.FETCH_REQUEST:
      return { ...state, loading: true, error: "" };
    case actionTypes.FETCH_SUCCESS:
      return { ...state, loading: false, order: action.payload, error: "" };
    case actionTypes.FETCH_FAIL:
      return { ...state, loading: false, error: action.payload };
    case actionTypes.PAY_REQUEST:
      return { ...state, loadingPay: true };
    case actionTypes.PAY_SUCCESS:
      return { ...state, loadingPay: false, successPay: true };
    case actionTypes.PAY_FAIL:
      return { ...state, loadingPay: false, errorPay: action.payload };
    case actionTypes.PAY_RESET:
      return { ...state, loadingPay: false, successPay: false, errorPay: "" };
    default:
      return state;
  }
}

const Order = ({
  params,
}: InferGetServerSidePropsType<typeof getServerSideProps>): React.ReactNode => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const orderId = params.id;
  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();
  const classes = useStyles();
  const router = useRouter();
  const { state } = useContext(StoreContext);
  const { userInfo } = state;

  const [{ loading, error, order, successPay }, dispatch] = useReducer(reducer, {
    loading: true,
    order: null,
    error: "",
  });

  useEffect(() => {
    if (!userInfo) {
      router.push("/login");
      return;
    }
    const fetchOrder = async () => {
      try {
        dispatch({ type: actionTypes.FETCH_REQUEST });
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo?.token}` },
        });
        dispatch({ type: actionTypes.FETCH_SUCCESS, payload: data });
      } catch (err) {
        dispatch({ type: actionTypes.FETCH_FAIL, payload: getError(err) });
      }
    };
    // fetchOrder();
    if (!order?._id || successPay || (order?._id && order?._id !== orderId)) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: "PAY_RESET" });
      }
    } else {
      const loadPaypalScript = async () => {
        const { data: clientId } = await axios.get("/api/keys/paypal", {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: DISPATCH_ACTION.RESET_OPTIONS,
          value: {
            "client-id": clientId,
            currency: "USD",
          },
        });
        paypalDispatch({ type: DISPATCH_ACTION.LOADING_STATUS, value: SCRIPT_LOADING_STATE.PENDING });
      };
      loadPaypalScript();
    }
  }, [order, successPay]);

  function createOrder(data: Record<string, unknown>, actions: any) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { value: String(order?.totalPrice) },
          },
        ],
      })
      .then((orderID: any) => {
        return orderID;
      });
  }
  function onApprove(data: any, actions: any) {
    return actions.order.capture().then(async function (details: any) {
      try {
        dispatch({ type: actionTypes.PAY_REQUEST });
        const { data } = await axios.put(
          `/api/orders/${order?._id}/pay`,
          details,
          {
            headers: { authorization: `Bearer ${userInfo?.token}` },
          }
        );
        dispatch({ type: actionTypes.PAY_SUCCESS, payload: data });
        enqueueSnackbar("Order is paid", { variant: "success" });
      } catch (err) {
        dispatch({ type: actionTypes.PAY_FAIL, payload: getError(err) });
        enqueueSnackbar(getError(err), { variant: "error" });
      }
    });
  }

  function onError(err:any) {
    enqueueSnackbar(getError(err), { variant: "error" });
  }

  if (order) {
    const {
      shippingAddress,
      paymentMethod,
      orderItems,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid,
      paidAt,
      isDelivered,
      deliveredAt,
    } = order as IOrder;

    return (
      <Layout title={`Order ${orderId}`}>
        <Typography component="h1" variant="h1">
          Order {orderId}
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography className={classes.error}>{error}</Typography>
        ) : (
          <Grid container spacing={1}>
            <Grid item md={9} xs={12}>
              <Card className={classes.section}>
                <List>
                  <ListItem>
                    <Typography component="h2" variant="h2">
                      Shipping Address
                    </Typography>
                  </ListItem>
                  <ListItem>
                    {shippingAddress.fullName}, {shippingAddress.address},{" "}
                    {shippingAddress.city}, {shippingAddress.postalCode},{" "}
                    {shippingAddress.country}
                  </ListItem>
                  <ListItem>
                    Status:{" "}
                    {isDelivered
                      ? `delivered at ${deliveredAt}`
                      : "not delivered"}
                  </ListItem>
                </List>
              </Card>
              <Card className={classes.section}>
                <List>
                  <ListItem>
                    <Typography component="h2" variant="h2">
                      Payment Method
                    </Typography>
                  </ListItem>
                  <ListItem>{paymentMethod}</ListItem>
                  <ListItem>
                    Status: {isPaid ? `paid at ${paidAt}` : "not paid"}
                  </ListItem>
                </List>
              </Card>
              <Card className={classes.section}>
                <List>
                  <ListItem>
                    <Typography component="h2" variant="h2">
                      Order Items
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Image</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(orderItems as Array<IOrderItems>).map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={50}
                                  height={50}
                                ></Image>
                              </TableCell>

                              <TableCell>
                                <Typography>{item.name}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography>{item.quantity}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography>${item.price}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </ListItem>
                </List>
              </Card>
            </Grid>
            <Grid item md={3} xs={12}>
              <Card className={classes.section}>
                <List>
                  <ListItem>
                    <Typography variant="h2">Order Summary</Typography>
                  </ListItem>
                  <ListItem>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography>Items:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography align="right">${itemsPrice}</Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <ListItem>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography>Tax:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography align="right">${taxPrice}</Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <ListItem>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography>Shipping:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography align="right">${shippingPrice}</Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <ListItem>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography>
                          <strong>Total:</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography align="right">
                          <strong>${totalPrice}</strong>
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                  {!isPaid && (
                    <ListItem>
                      {isPending ? (
                        <CircularProgress />
                      ) : (
                        <div className={classes.fullWidth}>
                          <PayPalButtons
                            createOrder={createOrder}
                            onApprove={onApprove}
                            onError={onError}
                          ></PayPalButtons>
                        </div>
                      )}
                    </ListItem>
                  )}
                </List>
              </Card>
            </Grid>
          </Grid>
        )}
      </Layout>
    );
  }

  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;
  return { props: { params } };
};

export default dynamic(() => Promise.resolve(Order) as LoaderComponent<any>, {
  ssr: false,
});
