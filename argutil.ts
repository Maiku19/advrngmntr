function isPresent(arg: string): boolean
{
  for (const argument of arguments) 
  {
    const argStr = argument as string;
    if (argStr.startsWith("--")) { continue; }
    if (!argStr.startsWith("-")) { continue; }

    if (!argStr.includes(arg)) { continue; }

    return true;
  }

  return false;
}

function isPresentFull(longArg: string) 
{
  for (const argument of arguments) 
  {
    if (!(argument as string).startsWith(`--${longArg}`)) { continue; }

    return true;
  }

  return false;
}

export function getFlag(flag: string, flagLong: string): boolean
{
  return getFlagShort(flag) || getFlagFull(flagLong);
}

export function getFlagShort(flag: string): boolean
{
  return isPresent(flag);
}

export function getFlagFull(longFlag: string): boolean
{
  return isPresentFull(longFlag);
}