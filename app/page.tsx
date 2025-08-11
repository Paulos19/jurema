'use client'

import { createPixPayment } from "./actions/abacate-pay";

export default function Home() {
  const handlePixPayment = async () => {
    try {
      const product = {
        externalId: 'qualquer-coisa',
        name: 'Teste',
        description: 'Produto teste',
        quantity: 1,
        price: 24999
      }

      const paymentDetails = await createPixPayment(product)

      console.log(paymentDetails)

      if (paymentDetails?.data.url) {
        window.location.href = paymentDetails.data.url
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <button onClick={handlePixPayment}>Clique aqui</button>
    </div>
  );
}
