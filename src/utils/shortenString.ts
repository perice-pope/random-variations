export default function shortenString(value?: string, maxLength: number = 50) {
  if (!value) {
    return value
  }

  if (value.length > maxLength) {
    return `${value.substr(0, maxLength)}...`
  }

  return value
}
