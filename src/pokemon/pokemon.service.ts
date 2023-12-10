import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {


  constructor(
    
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

  ){}

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try{

      const pokemon = await this.pokemonModel.create(createPokemonDto);

      return pokemon;

    } catch(error){
      this.handleExceptions(error);

    }
    
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string) {

    let pokemon: Pokemon;

    if( !isNaN(+term) ){
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    //Mongo id, name
    if( !pokemon && isValidObjectId( term )){
      pokemon = await this.pokemonModel.findById(term);
    }

    if( !pokemon){
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() });
    }

    if( !pokemon ) throw new NotFoundException(`Pokemon with id, name or no "${term}" not found`);

    

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne( term );
    if( updatePokemonDto.name ){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      await pokemon.updateOne( updatePokemonDto, { new: true } );

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    }

    if(updatePokemonDto.no){
      
      try {
        
        await pokemon.updateOne( updatePokemonDto, { new: true } );

        return { ...pokemon.toJSON(), ...updatePokemonDto };

      } catch (error) {
        this.handleExceptions( error );
      }
    }
    
  }

  async remove(id: string) {
    
    /* const pokemon = await this.findOne( id );
    await pokemon.deleteOne(); */

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    
    if( deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id "${id} not found`)

      return
  }

  private handleExceptions( error: any ){
    if( error.code === 11000 ){
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
