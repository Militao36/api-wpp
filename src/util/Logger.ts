class Logger {
  info (...args: any) {
    console.info(args)
  }

  error (...args: any) {
    console.error(args)
  }

  warn (...args: any) {
    console.warn(args)
  }
}

export { Logger }