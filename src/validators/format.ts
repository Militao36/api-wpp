const formatErrosJoi = (erros: any): [string] => {
  const messages = erros?.details.map((v: { path: any, message: any }) => {
    return {
      [v.path]: v.message
    }
  })

  return messages ?? null
}

export { formatErrosJoi }