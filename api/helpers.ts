export const getRandom:<T>(array:T[],length?:number) => Array<T> = <T>(array, length=1) => {
  const copy = [...array];
  const newArr:T[] = [];

  while(newArr.length < length || copy.length > 0){
    newArr.push(copy.splice(Math.random() * (array.length - 1), 1)[0]);
  }

  return newArr;
}