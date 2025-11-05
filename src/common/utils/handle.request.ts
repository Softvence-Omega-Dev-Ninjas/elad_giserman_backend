export async function handleRequest<T>(
  action: () => Promise<T>,
  successMessage: string,
) {
  try {
    const result = await action();
    return {
      status: 'success',
      message: successMessage,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: error.message || 'Something went wrong',
    };
  }
}
