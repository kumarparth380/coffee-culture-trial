import { shopType, useForCustomersStore } from "@/stores/for-customer-store";
import React, { useState } from "react";
import { SmolLogo } from "../navigation/icons";
import { Button, TextField } from "@mui/material";
import { useMutation } from "react-query";
// import toast from "react-hot-toast";
import axios from "axios";
import stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";
import { loadEnvConfig } from "@next/env";
import { base } from "@/api/endpoints";
import { getHoverColor, getTransBackgroundColor } from "@/utils/colourUtils";

export default function Add({
  shop,
  selected,
}: {
  shop: shopType | null;
  selected: string | null;
}) {
  const [packageDetails, setPackageDetails] = useState({
    email: "",
    contactNumber: "",
    shopId: shop?._id,
    type: "prepaidCard",
  });
  const [giftCardDetails, setGiftCardDetails] = useState({
    shopId: shop?._id,
    senderDetails: {
      email: "",
      contactNumber: "",
      name: "",
    },
    // receiverEmail: "",
    receiverName: "",
    senderMessage: "",
    type: "giftCard",
  });
  const isGift = selected == "gift";

  console.log(shop);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

  const handleSubmit = async () => {
    // e.preventDefault();
    // if (user.userType == UserType.SHOP) {
    //   registerShopMutation.mutate({email: user.email, password: user.password, firstName: user.firstName})
    // }
    // isGift ? console.log(giftCardDetails) : console.log(packageDetails);
    if (isGift) {
      console.log(giftCardDetails);
      registerBundleMutation.mutate({
        shopId: giftCardDetails.shopId!,
        type: giftCardDetails.type,
        senderDetails: {
          email: giftCardDetails.senderDetails.email,
          name: giftCardDetails.senderDetails.name,
          contactNumber: giftCardDetails.senderDetails.contactNumber,
        },
        receiverName: giftCardDetails.receiverName,
        message: giftCardDetails.senderMessage,
      });
    } else {
      console.log(packageDetails);
      registerBundleMutation.mutate({
        email: packageDetails.email,
        shopId: packageDetails.shopId!,
        contactNumber: packageDetails.contactNumber,
        type: packageDetails.type,
      });
    }
  };

  const registerBundleMutation = useMutation({
    mutationFn: async (values: {
      email?: string;
      shopId: string;
      contactNumber?: string;
      type: string;
      senderDetails?: {
        email: string;
        name: string;
        contactNumber: string;
      };
      receiverName?: string;
      message?: string;
    }) => {
      // return Endpoints.registerShopUser(values);
      try {
        console.log(values.shopId);
        const response = await base.post(
          `/trial/payments/create-checkout-session`,
          values
        );
        console.log(response?.status);
        if (response.status >= 200 && response.status < 300) {
          const session = await response.data;
          return session;
        } else {
          throw new Error(
            response.data.message || "create checkout session failed"
          );
        }
      } catch (error: any) {
        if (error.response) {
          console.error("Error registering user:", error);
          // return error.response.data;
          throw new Error(
            error.response.data.message || "create checkout session failed"
          );
        } else {
          // return error;
          console.error("Error registering user:", error);
          throw new Error(error);
        }
      }
    },
    onSuccess: async (session) => {
      // // router.push( pathname + "?" + createQueryString("step", "2"))
      // addQueryParam('step', '2');
      // removeQueryParam('register');
      // router.push('/register/step-2')
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.id,
        });
        if (error) {
          console.error("Stripe redirect error:", error);
        }
      } else {
        console.error("Stripe failed to load");
      }
    },
    onError: (error: any) => {
      //   toast.error("Failed to register user");
      console.log("going");
      console.log(error);
    },
  });

  return (
    <div className="container flex flex-col justify-start items-center px-8 gap-y-5 ">
      <div className="flex flex-col items-center justify-start mt-5">
        <img src={shop?.logo} alt="" className="w-7 h-7" />
        <div className="-mb-[5px] text-lg font-medium">{shop?.shopName}</div>
        <div className="text-[10px] flex items-end justify-center italic">
          <span className="pr-[1px]">x c</span>
          <SmolLogo className="mb-[3px]" />
          <span>ffee culture</span>
        </div>
      </div>
      <div className="px-7 py-8 flex justify-between items-center border-2 border-solid rounded-[10px] w-full" style={{
        borderColor: `#${shop?.lightBrandColour}`,
        backgroundColor: getTransBackgroundColor(`#${shop?.lightBrandColour}`, 0.2),
      }}>
        <div className="flex flex-col justify-center items-center">
          <div className="text-2xl font-medium -mb-[3px]">
            £
            {!isGift
              ? shop?.prepaidCardPackage.price
              : shop?.giftCardPackage.price}
          </div>
          {isGift && <div className="text-xs font-medium">Gift a friend</div>}
          <div className="text-xs">
            {!isGift
              ? `for ${shop?.prepaidCardPackage.drinksAllowance}`
              : shop?.giftCardPackage.drinksAllowance}{" "}
            drinks
          </div>
        </div>
        <div className="flex items-center justify-center text-xs">
          <img
            src="https://raw.githubusercontent.com/reannab16/coffee-culture-trial/ce4d061db63b80357eaef8e223196cae6e26cda8/public/taskBullet.svg"
            alt=""
            className="w-4 h-4 mr-1"
          />
          added to basket
        </div>
      </div>
      {isGift && (
        <TextField
          id="outlined-required"
          label="Your Name"
          variant="outlined"
          value={
            giftCardDetails.senderDetails.name
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setGiftCardDetails({
              ...giftCardDetails,
              senderDetails: {
                ...giftCardDetails.senderDetails,
                name: e.target.value,
              },
            })
          }}
          sx={{
            fontSize: "12px",
            fontFamily: "Inter",
          }}
          fullWidth
          inputProps={{
            style: { fontSize: 12 },
          }}
          InputLabelProps={{
            style: { fontSize: 12, display: "flex", alignItems: "center" },
          }}
          color="primary"
        />
        
      )}
      <TextField
        id="outlined-required"
        label={isGift ? "Your Email" : "Email Address"}
        variant="outlined"
        value={
          isGift ? giftCardDetails.senderDetails.email : packageDetails.email
        }
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          //   setUser({ ...user, email: e.target.value });
          isGift
            ? setGiftCardDetails({
                ...giftCardDetails,
                senderDetails: {
                  ...giftCardDetails.senderDetails,
                  email: e.target.value,
                },
              })
            : setPackageDetails({ ...packageDetails, email: e.target.value });
        }}
        sx={{
          fontSize: "12px",
          fontFamily: "Inter",
        }}
        fullWidth
        inputProps={{
          style: { fontSize: 12 },
        }}
        InputLabelProps={{
          style: { fontSize: 12, display: "flex", alignItems: "center" },
        }}
        color="primary"
      />
      <TextField
        id="outlined-required"
        label="Phone Number"
        variant="outlined"
        value={
          isGift
            ? giftCardDetails.senderDetails.contactNumber
            : packageDetails.contactNumber
        }
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          //   setUser({ ...user, email: e.target.value });
          isGift
            ? setGiftCardDetails({
                ...giftCardDetails,
                senderDetails: {
                  ...giftCardDetails.senderDetails,
                  contactNumber: e.target.value,
                },
              })
            : setPackageDetails({
                ...packageDetails,
                contactNumber: e.target.value,
              });
        }}
        sx={{
          fontSize: "12px",
          fontFamily: "Inter",
        }}
        fullWidth
        inputProps={{
          style: { fontSize: 12 },
        }}
        InputLabelProps={{
          style: { fontSize: 12, display: "flex", alignItems: "center" },
        }}
        color="primary"
      />
      {isGift && (
        <TextField
          id="outlined-required"
          label="Recipient's Name"
          variant="outlined"
          value={
            giftCardDetails.receiverName
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setGiftCardDetails({
              ...giftCardDetails,
              receiverName: e.target.value,
            })
          }}
          sx={{
            fontSize: "12px",
            fontFamily: "Inter",
          }}
          fullWidth
          inputProps={{
            style: { fontSize: 12 },
          }}
          InputLabelProps={{
            style: { fontSize: 12, display: "flex", alignItems: "center" },
          }}
          color="primary"
        />
        
      )}
      {isGift && (
        <TextField
          id="outlined-required"
          label="Personal Message"
          variant="outlined"
          value={
            giftCardDetails.senderMessage
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setGiftCardDetails({
              ...giftCardDetails,
              senderMessage: e.target.value,
            })
          }}
          sx={{
            fontSize: "12px",
            fontFamily: "Inter",
          }}
          fullWidth
          inputProps={{
            style: { fontSize: 12 },
          }}
          InputLabelProps={{
            style: { fontSize: 12, display: "flex", alignItems: "center" },
          }}
          color="primary"
        />
        
      )}
      <Button
        type="submit"
        onClick={handleSubmit}
        variant="contained"
        color="secondary"
        sx={{
          fontWeight: "400",
          fontSize: "12px",
          paddingX: "24px",
          height: "44px",
          backgroundColor: `#${shop?.lightBrandColour}`,
          typography: "shopButtons",

          "&:hover": {
            backgroundColor: getHoverColor(`#${shop?.lightBrandColour}`),
          },
        }}
        disableElevation
        // onClick={() => {
        //   router.push(
        //     pathname + "?" + createQueryString("register", "true")
        //   );
        // }}
        fullWidth
      >
        Continue
      </Button>
    </div>
  );
}
