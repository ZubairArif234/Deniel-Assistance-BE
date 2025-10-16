
// import nodemailer from "nodemailer";

const nodemailer = require("nodemailer")
const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/config.env" });


const TENANT_ID = '9188040d-6c67-4c5b-b112-36a304b66dad';

// const transporter = nodemailer.createTransport({
//  host: "smtp-mail.outlook.com",
//   port: 587,
//   secure: false, // must be false for STARTTLS (TLS)
//   // auth: {
//   //   user: "iamzubairarif@outlook.com",
//   //   pass: "mhpzertuqnsuntxs", // your mailbox password or app password
//   // },
//    auth: {
//       type: 'OAuth2',
//       user: "iamzubairarif@outlook.com", // Your Outlook email
//       clientId: "506c45af-6c66-4f69-a804-1526fc6c1c4a", // Azure App Client ID
//       clientSecret: "oXX8Q~MZGrLvAD-Dhe4GPwgF04D876vmZUH7RcfV", // Azure App Client Secret
//       refreshToken: "M.C545_BAY.0.U.-Cu8!a80OJDGJ3Z3IAQZW*F2qNrdo7SeI1XXdTVwct0NUVLAjdPzyNqfDTOJGZEi*fAZAx1BM*18Ief75FEQxUkkk3B9o0ezU5!!TYAoR7XCs0Jjs!u9OW!YbEJccxOpsSQfRHA7vPJ89awkdIILQFb7rdxE6F5C7gIW2Y1FSj0xVV!oItIEQE6ZZELygRYMEQmVb8lksEQpag2YHIZmYz1fr7ScN1e0IbMlce8mTuySP7W35s!2EFURhtydyObxow1akgSQ63n770FGWUHJLd71bpYBA4x6wOd4ImN5!dD6KTdkw3fNnuSNi2YmnN90cbxLFcWhU0jz7kghoukk4PaDJMX1B8L1sbkvVCrdpW8z!QJAQynPsji1J*EBCi8ZP7NWBE1ImSi5pPAggqPDQuu69G!9FNrE9VzH!keOIbT3CCb47*z73VnEUgR9!CNsZ8Q$$",
//      accessToken: "EwBIBMl6BAAUBKgm8k1UswUNwklmy2v7U/S+1fEAAbDMxlRxYUNRT0+kMIars1Z7cWv6ZohSrL01MyT2UNj2BQSZLdyWdMOYyZ8u/LBjTUJeSXbVCT1dCmYP4owiJ4p0R6jrVPqpV3OaWhgBcmx1rmy7K+by2RzF99olWtQfwegmKDnPwOihZPfnjPp2ukaGoMpphQlVWnE5B50mAcPkpv+ZNZ6Zn7sSjOHhqTtH1kWzv95jiTuxtaTpf2zw+ECOgHCUxCLagRlqXVrbE3abyz48bPK6HtWA9u4fPdDrCDF/kFL/B9ghp+kuVpMqJQ9wJOSzfapn7T0QL0WR0OJ9Xd5+eYaMPK0FCD8m27DwvblLPxiDD517poUOmY3YJz0QZgAAEJpq5o47kyEABn+7ixrwMxAQAzPxSACAeny/ScdvHw+3I/lgZdFT2W7KOlQiaBnRqT1UUeVf7fDnp6J9i7g02oUunPvcPUWYXcatEM3DznoxFY77eleyGZjb7uoffPCyjX/2DFSW+8CY/t1I9iMPPCacnlF3a7bZAOaTP9upQ5lT0EQFARcqkuADG3F0SOiNN7CfZ7/I2if30Nqkik1hQeqb8ggh6KN4YeJ/nDGER7YHNI81Isonh2IVCcpCsW1Xb3r59c0W+QCq+aukDQ/l+2K/2/rXs2KEehQ7Fd4bsvTtbQQzNNCyQX7ccjmlX6AM4gTq5/4TLK2/ZJUDIqXFUt2MsZkcZWRPRGZ/emNEZY97voUsT4xVK38hVNfYkaYKTsTcbD96KUz4ONW2I/R1UntPu5ICYZa/2ZIU+b8aQsgSI7ULxJ+bjodXzV7JS9QBUw7kl7esiIB4FsH+NIcXGBPpllYKhm/cGLZ2DPjc86P8HUxcZp8MNNys90pxHILrpSGNw+j/BpMvfWoBQlyu+KwcumertkJqjyBl1U2aMFcI2J9OIh77CuPw63jnwAbUtfp9mBdAw7ToT6gNSuhW/n/fpc4pPF7CJ92yv0SmTs4VrvtzhivFijN8TiCbGwxj9ut4rEGgfgnrEP/EQz0q9Q2AsUABIvHklx9j/bezf0ovOsowPCx1Tm9tsgW9Fq3BrY+01HM82lj7XDACo1kV1TpsrVy3gWfqejIcbTreOVr+wRDEBK2U+ou3ilvX5ew3tsA025YQGjPHOt5t8cOXSmajVL425J94m5u7ALBOFP/PW8wgvCsBWcNZbS+m8rCbkro1gEANsK4sAOVvlM3YWGeJR8fSWnZDgudotpYQ+poz86TETWSncRYs+1Gx1JwvWVlNgvEO9PWagMlApia5LS1KM2EgGlEejvjKWuAoP9+ShQFGcekRIjNnna2OVL977d9P6BmByQBn8qDMXsa61cEVmMqlZ2MRCJbyJeAKyj0xUzJxiLbw0pFH1pzjjIVZWxG+oxj1wRG1RP6GLfG0UJAIWA3bnoEx0CHmjFFeAkDjMtdaAw==", // Optional: OAuth2 Access Token

//     },
//     tls: {
//       ciphers: 'SSLv3',
//       rejectUnauthorized: false
//     }
// });
const transporter = nodemailer.createTransport({
  service: "gmail",                  // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL,           // e.g. 'noreply@analyzemydenial.com'
    pass: process.env.APP_PASSWORD,  // your PrivateEmail mailbox password
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with mail transporter config:", error);
  } else {
    console.log("Mail transporter is ready to send emails");
  }
});


module.exports = transporter;