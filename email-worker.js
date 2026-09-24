export default {
  async email(message, env, ctx) {
    await Promise.all([
      message.forward("yutahiroko0408@gmail.com"),
      message.forward("igravity.20260305@gmail.com"),
    ]);
  },
};
