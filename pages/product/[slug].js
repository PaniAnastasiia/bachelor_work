import React, { useCallback, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Layout from '../../components/Layout';
import Product from '../../models/Product';
import db from '../../utils/db';
import axios from 'axios';
import { Store } from '../../utils/Store';
import { getError } from '../../utils/error';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import Rating from '../../components/Rating';
import { useForm } from 'react-hook-form';

export default function ProductScreen(props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { product } = props;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const submitHandler = async ({ rating, comment }) => {
    setLoading(true);
    try {
      await axios.post(`/api/products/${product._id}/reviews`, {
        rating,
        comment,
      });
      setLoading(false);
      toast.success('Review submitted successfully');
      fetchReviews();
    } catch (err) {
      setLoading(false);
      toast.error(getError(err));
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      if (!product) {
        return;
      }
      const { data } = await axios.get(`/api/products/${product._id}/reviews`);
      setReviews(data);
    } catch (err) {
      toast.error(getError(err));
    }
  }, [product]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  if (!product) {
    return (
      <Layout>
        <h3 className="text-center">404 : Product Not Found</h3>
      </Layout>
    );
  }
  const addToCartHandler = async () => {
    const existItem = cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      toast.error('Sorry. Product is out of stock');
      return;
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } });
    router.push('/cart');
  };

  return (
    <Layout title={product.name}>
      <div className="py-2">
        <Link href="/">back to products</Link>
      </div>
      <div className="grid md:grid-cols-5 md:gap-3">
        <div className="md:col-span-2">
          <Image
            src={product.image}
            alt={product.name}
            width={640}
            height={640}
            layout="responsive"
          ></Image>
        </div>
      <div>
        <div className="card p-5">       
         <div>
          <ul>
            <li>
              <h1 className="text-lg">{product.name}</h1>
            </li>
            <li>Category: {product.category}</li>
            <li>Brand: {product.brand}</li>
            <li>
              <Rating rating={product.rating} />
            </li>
           
          </ul>

            <div className="mb-2 flex justify-between">
              <div>Price</div>
              <div>${product.price}</div>
            </div>
            <div className="mb-2 flex justify-between">
              <div>Status</div>
              <div>{product.countInStock > 0 ? 'In stock' : 'Unavailable'}</div>
            </div>
            <button
              className="primary-button w-full"
              onClick={addToCartHandler}
            >
              Add to cart
            </button>
          </div>
        </div>          
      </div>
      </div>
      <br></br>
      <div>
        <div className="font-bold">Description </div>{product.description}
      </div>
      <br></br>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { params } = context;
  const { slug } = params;

  await db.connect();
  const product = await Product.findOne({ slug }, '-reviews').lean();
  await db.disconnect();
  return {
    props: {
      product: product ? db.convertDocToObj(product) : null,
    },
  };
}
