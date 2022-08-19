import chalk from 'chalk';

export function logTokensWon(accountName: string, tokenName: string, amount: number) {
    setTimeout(() => {
        console.log(chalk.grey(`      ${ accountName } got ${ chalk.greenBright(`${ amount } ${ tokenName }`) }`));
    });
}
