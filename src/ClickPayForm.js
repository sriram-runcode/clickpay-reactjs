import React, { useEffect, useRef, useState } from 'react';

const ClickPayForm = () => {
  const iframeRef = useRef(null);
  const [paymentToken, setPaymentToken] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = `
        <html>
          <head>
            <script src='https://secure.clickpay.com.sa/payment/js/paylib.js'></script>
          </head>
          <body>
            <form id='payform'>
              <span id='paymentErrors' style="color: red; font-weight: bold;"></span>
              <div>
                <label>Card Number</label>
                <input type='text' data-paylib='number' size='20' />
              </div>
              <div>
                <label>Expiry Date (MM/YYYY)</label>
                <input type='text' data-paylib='expmonth' size='2' />
                <input type='text' data-paylib='expyear' size='4' />
              </div>
              <div>
                <label>Security Code</label>
                <input type='text' data-paylib='cvv' size='4' />
              </div>
              <input type='submit' value='Generate Token' />
            </form>
            <script>
              var myform = document.getElementById('payform');
              paylib.inlineForm({
                key: 'CNKMTR-RTP96B-6GRHBN-GGM7KV',
                form: myform,
                autoSubmit: false,
                callback: function(response) {
                  document.getElementById('paymentErrors').innerHTML = '';
                  if (response.error) {
                    paylib.handleError(document.getElementById('paymentErrors'), response);
                  } else if (response.token) {
                    window.parent.postMessage(
                      { type: 'paymentToken', token: response.token },
                      '*'
                    );
                    document.getElementById('paymentErrors').innerHTML = 'Token generated!';
                  }
                }
              });
            </script>
          </body>
        </html>
      `;
    }
  }, []);

  // Listen for token message from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'paymentToken') {
        setPaymentToken(event.data.token);
        setStatus('Token received, ready to process payment.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Generate an alphanumeric value with 8 digits
  const generateAlphanumeric = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }

  const handlePayment = async () => {
    if (!paymentToken) {
      setStatus('Please generate the payment token first.');
      return;
    }

    const payload = {
      "profile_id": "46667",
      "tran_type": "sale",
      "tran_class": "ecom",
      "cart_description": "Test Payment",
      "cart_id": generateAlphanumeric(8),
      "cart_currency": "INR",
      "cart_amount": 100,
      "callback": "https://307767a9ca90.ngrok-free.app/api/ClientCollections/collectionViaClickPay?accessToken=AOQZFqb0bPKtPTsU91P7FhHZG460wEY962eGUAYxT8JdDZ72rWZRX2xujWO7zEBm",
      "return": "https://rcsfaweb.z22.web.core.windows.net/login",
      "payment_token": paymentToken,
      "customer_details": {
        "name": "John Smith",
        "email": "jsmith@gmail.com",
        "phone": "9711111111111",
        "street1": "404, 11th st, void",
        "city": "Dubai",
        "state": "DU",
        "country": "AE",
        "ip": "125.17.251.66"
      }
    };

    try {
      const res = await fetch('https://secure.clickpay.com.sa/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': 'S2JNMHKBNL-JLJ6RHLMLJ-K29HTTRW9M', 'Sec-Fetch-Mode': 'cors' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(data);
      setStatus('Payment processed successfully.');
    } catch (error) {
      console.error(error);
      setStatus('Payment processing failed.');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <iframe
        ref={iframeRef}
        title="ClickPay Payment Form"
        width="100%"
        height="600"
        className="rounded-2xl shadow border max-w-md mx-auto"
      ></iframe>

      <button
        onClick={handlePayment}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Process Payment
      </button>

      <p className="text-center font-medium">{status}</p>
    </div>
  );
};

export default ClickPayForm;
