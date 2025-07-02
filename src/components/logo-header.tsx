import Image from "next/image"

export default function LogoHeader({ withName = true }: { withName?: boolean }) {
  return (
    <header className="flex shrink-0 items-center gap-2 px-2 pt-1 h-fit">
      <div className="flex items-center gap-1">
        <Image src={"/logo-only.png"} alt="N.A.M.E" height={65} width={65} />
        {withName && (
          <h1 className="text-xl font-mono font-extrabold text-black dark:text-white">N.A.M.E</h1>
        )}
      </div>
    </header>
  )
}