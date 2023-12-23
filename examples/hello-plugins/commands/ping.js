export default async (ctx) => {
  const user = await ctx.database.in('users').findByID(ctx.from.id)
  if (!user) {
    await ctx.database.in('users').create(ctx.from.id)
    ctx.reply('pong (não te conhecia, mas agora já te conheço)')
  } else {
    ctx.reply('pong (já te conhecia)')
  }
}

export const info = {
  aliases: ['pang']
}
