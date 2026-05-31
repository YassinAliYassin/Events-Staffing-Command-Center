export default function handler(req, res) {
  return res.status(200).json({ 
    test: 'success',
    hasEmail: !!process.env.ICLOUD_EMAIL,
    hasPassword: !!process.env.ICLOUD_APP_PASSWORD
  });
}
