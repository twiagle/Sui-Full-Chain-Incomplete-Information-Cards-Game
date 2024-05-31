function setRangeToBinary(ranges: [number, number][]) {
  // 创建一个0-15的二进制数组
  const binaryArray: number[] = Array.from({ length: 52 }, () => 0);

  // 遍历每个区间,并设置对应的位为1
  for (const [start, end] of ranges) {
    for (let i = start; i <= end; i++) {
      binaryArray[51 - i] = 1;
    }
  }

  // 将二进制数组转换为十进制数值
  let decimalValue = 0;
  for (let i = 0; i < binaryArray.length; i++) {
    decimalValue = decimalValue * 2 + binaryArray[i];
  }

  return decimalValue;
}

function setListToBinary(positions: number[]) {
  let binaryNumber = 0;
  for (const position of positions) {
    binaryNumber |= (1 << position);
  }
  return binaryNumber;
}

// 测试函数
// console.log(setRangeToBinary([[0, 15]])); // 输出: 31
// console.log(setRangeToBinary([[16, 31]])); // 输出: 16
// console.log(setRangeToBinary([[32, 51]])); // 输出: 65535

function getCardIdsFromUint8(num: number): number[] {
  const binaryString = num.toString(2);
  console.log(binaryString);
  const cardIds: number[] = [];
  for (let i = binaryString.length - 1; i >= 0; i--) {
    if (binaryString[i] === "1") {
      cardIds.push(binaryString.length - 1 - i);
    }
  }
  return cardIds
}

// console.log(getCardIdsFromUint8(0xffff))
// console.log(getCardIdsFromUint8(0xffff0000))
// console.log(getCardIdsFromUint8(0xfffff00000000))
console.log(setListToBinary([1, 2, 3]))