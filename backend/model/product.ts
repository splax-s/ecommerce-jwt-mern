import mongoose, { Document, Schema } from 'mongoose';

interface Image {
  public_id: string;
  url: string;
}

interface Review {
  user: object;
  rating?: number;
  comment?: string;
  productId: string;
  createdAt: Date;
}

interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: Image[];
  reviews: Review[];
  ratings?: number;
  shopId: string;
  shop: object;
  sold_out?: number;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
  },
  tags: String,
  originalPrice: Number,
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  images: [{
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  }],
  reviews: [{
    user: Object,
    rating: Number,
    comment: String,
    productId: String,
    createdAt: {
      type: Date,
      default: Date.now(),
    }
  }],
  ratings: Number,
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export default mongoose.model<IProduct>('Product', productSchema);
